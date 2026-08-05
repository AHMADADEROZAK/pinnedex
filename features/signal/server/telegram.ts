import { connectToDatabase } from "@/lib/mongodb";
import { Subscription } from "@/features/signal/models/Subscription";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const BASE = BOT_TOKEN
  ? `https://api.telegram.org/bot${BOT_TOKEN}`
  : null;

export async function sendTelegram(text: string): Promise<boolean> {
  if (!BASE || !CHAT_ID) return false;
  return sendTelegramToChat(CHAT_ID, text);
}

export async function sendTelegramToChat(
  chatId: string,
  text: string,
): Promise<boolean> {
  if (!BASE || !chatId) return false;

  try {
    const res = await fetch(`${BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

async function activeMemberChatIds(): Promise<string[]> {
  try {
    await connectToDatabase();
    const subs = await Subscription.find({
      status: "active",
      expiresAt: { $gt: new Date() },
      telegramChatId: { $exists: true, $ne: "" },
    })
      .select("telegramChatId")
      .lean()
      .exec();
    return [...new Set(subs.map((s) => String(s.telegramChatId)))];
  } catch {
    return [];
  }
}

export async function sendTakeoverAlerts(text: string): Promise<number> {
  const chatIds = await activeMemberChatIds();
  let sent = 0;
  for (const chatId of chatIds) {
    if (await sendTelegramToChat(chatId, text)) sent += 1;
  }
  return sent;
}

export function telegramEnabled(): boolean {
  return Boolean(BASE);
}

export async function setTelegramWebhook(url: string): Promise<boolean> {
  if (!BASE) return false;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined;
  try {
    const res = await fetch(`${BASE}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface TelegramUpdate {
  message?: {
    message_id?: number;
    chat?: { id: number; type: string };
    text?: string;
  };
}

export async function processBotUpdate(update: TelegramUpdate): Promise<void> {
  const text = update.message?.text?.trim();
  if (!text || !text.startsWith("/start")) return;

  const code = text.split(/\s+/)[1];
  const chatId = update.message?.chat?.id;
  if (!code || typeof chatId !== "number") return;

  try {
    await connectToDatabase();
    const sub = await Subscription.findOneAndUpdate(
      {
        telegramLinkCode: code,
        telegramLinkExpiresAt: { $gt: new Date() },
        status: "active",
      },
      {
        $set: {
          telegramChatId: String(chatId),
          telegramStatus: "connected",
        },
        $unset: { telegramLinkCode: "", telegramLinkExpiresAt: "" },
      },
      { new: true },
    ).exec();

    if (sub) {
      await sendTelegramToChat(
        String(chatId),
        "Connected to PINDEX Signal. You will receive CTO takeover alerts here.",
      );
    } else {
      await sendTelegramToChat(
        String(chatId),
        "Link is invalid or expired. Open it again from your dashboard.",
      );
    }
  } catch {
    // ignore transient errors
  }
}
