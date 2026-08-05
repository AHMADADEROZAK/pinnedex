import WebSocket from "ws";

import { connectToDatabase } from "@/lib/mongodb";
import { DexEvent } from "@/features/signal/models/DexEvent";
import type { DexEventType } from "@/features/signal/models/DexEvent";
import { sendTelegramAlert } from "@/features/signal/server/telegram";

type StreamKey = "token-profiles" | "community-takeovers" | "token-boosts" | "ads";

const WSS_BASE = "wss://api.dexscreener.com";

const STREAMS: Record<StreamKey, { path: string; eventType: DexEventType }> = {
  "token-profiles": { path: "/token-profiles/latest/v1", eventType: "token-profile" },
  "community-takeovers": { path: "/community-takeovers/latest/v1", eventType: "community-takeover" },
  "token-boosts": { path: "/token-boosts/latest/v1", eventType: "boost" },
  ads: { path: "/ads/latest/v1", eventType: "ad" },
};

const RECENT_CAP = 2_000;

interface StreamStatus {
  ws: WebSocket | null;
  connected: boolean;
  eventsIngested: number;
  lastEventAt: Date | null;
  reconnectAttempts: number;
  lastError: string | null;
}

class DexIngestor {
  private streams = new Map<string, StreamStatus>();
  private recent = new Set<string>();
  private running = false;

  constructor() {
    for (const key of Object.keys(STREAMS)) {
      this.streams.set(key, {
        ws: null,
        connected: false,
        eventsIngested: 0,
        lastEventAt: null,
        reconnectAttempts: 0,
        lastError: null,
      });
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const key of Object.keys(STREAMS) as StreamKey[]) {
      this.connect(key);
    }
  }

  stop(): void {
    this.running = false;
    for (const [, status] of this.streams) {
      if (status.ws) {
        status.ws.close();
        status.ws = null;
      }
      status.connected = false;
    }
  }

  getStatus(): Record<string, Omit<StreamStatus, "ws">> {
    const result: Record<string, Omit<StreamStatus, "ws">> = {};
    for (const [key, status] of this.streams) {
      result[key] = {
        connected: status.connected,
        eventsIngested: status.eventsIngested,
        lastEventAt: status.lastEventAt,
        reconnectAttempts: status.reconnectAttempts,
        lastError: status.lastError,
      };
    }
    return result;
  }

  private connect(key: StreamKey): void {
    const stream = STREAMS[key];
    const status = this.streams.get(key)!;

    if (status.ws) {
      status.ws.close();
    }

    const url = `${WSS_BASE}${stream.path}`;
    const ws = new WebSocket(url);
    status.ws = ws;
    status.lastError = null;

    ws.on("open", () => {
      status.connected = true;
      status.reconnectAttempts = 0;
    });

    ws.on("message", (raw: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(raw.toString());
        const events = Array.isArray(parsed.data) ? parsed.data : parsed;
        const list = Array.isArray(events) ? events : [events];

        for (const event of list) {
          this.ingest(stream.eventType, event);
        }
      } catch {
        // skip malformed
      }
    });

    ws.on("error", () => {
      status.connected = false;
      status.lastError = "WebSocket error";
    });

    ws.on("close", () => {
      status.connected = false;
      status.ws = null;
      if (!this.running) return;
      this.scheduleReconnect(key);
    });
  }

  private scheduleReconnect(key: StreamKey): void {
    const status = this.streams.get(key)!;
    status.reconnectAttempts += 1;
    const max = Math.min(status.reconnectAttempts, 8);
    const delay = Math.random() * 1000 * Math.pow(2, max);

    setTimeout(() => {
      if (!this.running) return;
      this.connect(key);
    }, delay);
  }

  private dedupKey(type: DexEventType, chainId: string, tokenAddress: string): string {
    return `${type}:${chainId}:${tokenAddress}`;
  }

  private async ingest(
    eventType: DexEventType,
    raw: Record<string, unknown>,
  ): Promise<void> {
    const chainId = String(raw.chainId ?? "");
    const tokenAddress = String(raw.tokenAddress ?? "");
    if (!chainId || !tokenAddress) return;

    const key = this.dedupKey(eventType, chainId, tokenAddress);
    if (this.recent.has(key)) return;

    this.recent.add(key);
    if (this.recent.size > RECENT_CAP) {
      this.recent = new Set([...this.recent].slice(-RECENT_CAP / 2));
    }

    try {
      await connectToDatabase();
      await DexEvent.create({
        type: eventType,
        chainId,
        tokenAddress,
        payload: raw,
        seenAt: new Date(),
      });

      const status = this.getStatusForEventType(eventType);
      if (status) {
        status.eventsIngested += 1;
        status.lastEventAt = new Date();
      }

      void this.alertIfRelevant(eventType, chainId, tokenAddress, raw);
    } catch {
      // skip duplicate / transient db errors
    }
  }

  private getStatusForEventType(et: DexEventType): StreamStatus | null {
    for (const [key] of Object.entries(STREAMS)) {
      if (STREAMS[key as StreamKey].eventType === et) {
        return this.streams.get(key) ?? null;
      }
    }
    return null;
  }

  private alertIfRelevant(
    eventType: DexEventType,
    _chainId: string,
    tokenAddress: string,
    raw: Record<string, unknown>,
  ): void {
    if (!tokenAddress) return;

    if (eventType === "community-takeover") {
      sendTelegramAlert(eventType, raw).catch(() => {});
    } else if (eventType === "boost" || eventType === "token-profile") {
      sendTelegramAlert(eventType, raw).catch(() => {});
    }
  }
}

const ingestor = new DexIngestor();

export function startDexIngestion(): void {
  ingestor.start();
}

export function stopDexIngestion(): void {
  ingestor.stop();
}

export function dexIngestorStatus() {
  return ingestor.getStatus();
}