import { connectToDatabase } from "@/lib/mongodb";
import { Subscription } from "@/features/signal/models/Subscription";
import type { DexEventType } from "@/features/signal/models/DexEvent";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

interface TokenLink {
  type?: string | null;
  label?: string | null;
  url: string;
}

export interface ToTelegramToken {
  chainId?: string;
  tokenAddress?: string;
  icon?: string;
  header?: string;
  url?: string;
  description?: string | null;
  links?: TokenLink[] | null;
  amount?: number;
  totalAmount?: number;
  claimDate?: string;
  type?: string;
  date?: string;
}

const LINK_LABELS: Record<string, string> = {
  twitter: "X",
  x: "X",
  telegram: "Telegram",
  tiktok: "TikTok",
  reddit: "Reddit",
  instagram: "Instagram",
  discord: "Discord",
  youtube: "YouTube",
  website: "Website",
};

const EVENT_TITLES: Record<DexEventType, string> = {
  "community-takeover": "Community Takeover",
  boost: "Token Boost",
  "token-profile": "Token Profile",
  ad: "Ad",
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAlertHtml(
  eventType: DexEventType,
  raw: ToTelegramToken,
): string {
  const lines: string[] = [];

  lines.push(`<b>${escapeHtml(EVENT_TITLES[eventType] ?? "Signal")}</b>`);

  if (raw.chainId) lines.push(`Chain: <code>${escapeHtml(raw.chainId)}</code>`);
  if (raw.tokenAddress) {
    lines.push(`Token: <code>${escapeHtml(raw.tokenAddress.slice(0, 12))}...</code>`);
  }

  if (eventType === "boost") {
    const amount = Number(raw.amount ?? 0);
    const total = Number(raw.totalAmount ?? 0);
    lines.push(
      `Amount: <b>$${escapeHtml(amount.toFixed(0))}</b> / <b>$${escapeHtml(total.toFixed(0))}</b>`,
    );
  }

  if (raw.claimDate) {
    const when = new Date(String(raw.claimDate));
    const text = Number.isNaN(when.getTime())
      ? escapeHtml(raw.claimDate)
      : escapeHtml(when.toLocaleString());
    lines.push(`Claim: <i>${text}</i>`);
  }

  if (raw.description) {
    lines.push(`\n${escapeHtml(raw.description)}`);
  }

  if (Array.isArray(raw.links) && raw.links.length > 0) {
    const parts = raw.links.map((link) => {
      const label =
        LINK_LABELS[link.type ?? ""] ??
        link.label ??
        link.type ??
        "link";
      return `<a href="${escapeHtml(link.url)}">${escapeHtml(label)}</a>`;
    });
    lines.push(`\n${parts.join(" · ")}`);
  }

  if (raw.url) {
    lines.push(`<a href="${escapeHtml(raw.url)}">View on DexScreener</a>`);
  }

  return lines.join("\n");
}

async function apiPost<T>(
  method: string,
  payload: Record<string, unknown>,
): Promise<T | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function sendText(chatId: string, text: string): Promise<boolean> {
  const result = await apiPost<{ ok: boolean }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
  return result?.ok === true;
}

async function sendPhoto(
  chatId: string,
  photoUrl: string,
  caption: string,
): Promise<boolean> {
  const result = await apiPost<{ ok: boolean }>("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: "HTML",
  });
  return result?.ok === true;
}

export async function sendTelegram(text: string): Promise<boolean> {
  if (!CHAT_ID) return false;
  return sendText(CHAT_ID, text);
}

export async function sendTelegramToChat(
  chatId: string,
  text: string,
): Promise<boolean> {
  return sendText(chatId, text);
}

export async function sendTelegramAlert(
  eventType: DexEventType,
  raw: ToTelegramToken,
): Promise<number> {
  const chatIds = await activeMemberChatIds();
  const caption = buildAlertHtml(eventType, raw);
  let sent = 0;

  for (const chatId of chatIds) {
    let ok = false;
    if (raw.icon) {
      ok = await sendPhoto(chatId, raw.icon, caption);
    }
    if (!ok) {
      ok = await sendText(chatId, caption);
    }
    if (ok) sent += 1;
  }

  return sent;
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
    if (await sendText(chatId, text)) sent += 1;
  }
  return sent;
}

export function telegramEnabled(): boolean {
  return Boolean(BASE);
}

export async function setTelegramWebhook(url: string): Promise<boolean> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined;
  const result = await apiPost<{ ok: boolean }>("setWebhook", {
    url,
    secret_token: secret,
  });
  return result?.ok === true;
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
      await sendText(
        String(chatId),
        "Connected to PINDEX Signal. You will receive CTO takeover alerts here.",
      );
    } else {
      await sendText(
        String(chatId),
        "Link is invalid or expired. Open it again from your dashboard.",
      );
    }
  } catch {
    // ignore transient errors
  }
}