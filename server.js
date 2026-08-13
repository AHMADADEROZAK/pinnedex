import { createServer } from "node:http";

import { config as loadEnv } from "dotenv";
import next from "next";
import mongoose from "mongoose";
import { WebSocketServer } from "ws";

loadEnv();
if (process.env.NODE_ENV === "production") {
  loadEnv({ path: ".env.production", override: true });
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3112);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/pin-dex";

let dbPromise;
function getDb() {
  if (!dbPromise) {
    dbPromise = mongoose.connect(uri).then(() => mongoose.connection.db);
  }
  return dbPromise;
}

const PARTY_MAX_MESSAGES = 150;

async function verifyMember(memberId) {
  const db = await getDb();
  return db.collection("party_members").findOne({ memberId });
}

async function getMessageCount() {
  const db = await getDb();
  return db.collection("chat_messages").countDocuments();
}

async function insertMessage(member, text) {
  const db = await getDb();
  const createdAt = new Date();
  const doc = {
    id: crypto.randomUUID(),
    memberId: member.memberId,
    name: member.name,
    text,
    createdAt,
  };
  await db.collection("chat_messages").insertOne(doc);
  return { ...doc, createdAt: createdAt.toISOString() };
}

async function getRecentMessages(limit = 50) {
  const db = await getDb();
  const docs = await db
    .collection("chat_messages")
    .find({})
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    id: d.id,
    memberId: d.memberId,
    name: d.name,
    text: d.text,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
  }));
}

function broadcast(wss, data) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

const online = new Map();

function onlinePayload() {
  return [...online.values()].map((m) => ({
    memberId: m.memberId,
    name: m.name,
  }));
}

function broadcastPresence(wss) {
  broadcast(wss, { type: "presence", members: onlinePayload() });
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const wss = new WebSocketServer({ noServer: true });
  const upgradeHandler = app.getUpgradeHandler();

  server.on("upgrade", async (request, socket, head) => {
    try {
      const url = new URL(request.url ?? "", `http://${request.headers.host ?? hostname}`);

      if (url.pathname !== "/ws") {
        upgradeHandler(request, socket, head);
        return;
      }

      const memberId = url.searchParams.get("memberId") ?? "";

      const member = memberId ? await verifyMember(memberId) : null;
      if (memberId && !member) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, member);
      });
    } catch (err) {
      console.error("[ws] upgrade error", err);
      if (!socket.destroyed) {
        socket.write("HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n");
        socket.destroy();
      }
    }
  });

  wss.on("connection", (ws, _req, member) => {
    if (member) {
      online.set(member.memberId, { memberId: member.memberId, name: member.name });
      broadcastPresence(wss);
    }
    ws.send(JSON.stringify({ type: "presence", members: onlinePayload() }));

    (async () => {
      try {
        const [messages, total] = await Promise.all([
          getRecentMessages(),
          getMessageCount(),
        ]);
        ws.send(JSON.stringify({ type: "history", messages, total }));
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", error: "Failed to load history." }));
        console.error("[ws] history error", err);
      }
    })();

    ws.on("message", async (data) => {
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (parsed?.type !== "message") return;

      const content = String(parsed.content ?? "").trim();
      if (!content) return;

      if (!member) {
        ws.send(JSON.stringify({ type: "error", error: "Join the party to send messages." }));
        return;
      }

      try {
        const total = await getMessageCount();
        if (total >= PARTY_MAX_MESSAGES) {
          ws.send(JSON.stringify({ type: "full", total }));
          return;
        }

        const saved = await insertMessage(member, content.slice(0, 500));
        broadcast(wss, { type: "message", message: saved });
        broadcast(wss, { type: "count", total: total + 1 });
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", error: "Failed to send." }));
        console.error("[ws] send error", err);
      }
    });

    ws.on("error", (err) => {
      console.error("[ws] socket error", err);
    });

    ws.on("close", () => {
      if (member) {
        online.delete(member.memberId);
        broadcastPresence(wss);
      }
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Pinnedex ready on http://${hostname}:${port}`);
  });
});