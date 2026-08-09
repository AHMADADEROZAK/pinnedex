import { readFile } from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.TELEGRAM_PARTY_BOT_TOKEN ?? "";

const BASE = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

export function partyTelegramEnabled(): boolean {
  return Boolean(BASE);
}

export async function sendPartyMessage(
  chatId: number | string,
  text: string,
  parseMode?: "HTML",
): Promise<void> {
  await apiPost("sendMessage", { chat_id: chatId, text, parse_mode: parseMode });
}

export async function sendPartyOtpButton(
  chatId: number | string,
  text: string,
  uuid: string,
): Promise<void> {
  await apiPost("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Get verify code", callback_data: `get_otp:${uuid}` }],
      ],
    },
  });
}

export async function answerPartyCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await apiPost("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

export async function sendPartyOtpPhoto(chatId: number | string, otp: string): Promise<void> {
  const imagePath = path.join(process.cwd(), "public", "idd.jpeg");
  let buffer: Buffer;
  try {
    buffer = await readFile(imagePath);
  } catch {
    await sendPartyMessage(
      chatId,
      `🎉 Your verification code:\n\n${otp}\n\nEnter it on the website to finish registering.`,
    );
    return;
  }

  const form = new FormData();
  form.set("chat_id", String(chatId));
  form.set("caption", "🎉 Almost there! Your code is ready below.");
  form.set("parse_mode", "HTML");
  form.set("photo", new Blob([buffer.buffer as ArrayBuffer]), "idd.jpeg");

  await apiPost("sendPhoto", form);

  await sendPartyMessage(
    chatId,
    `👇 <b>Copy this code and paste it into the web verification:</b>\n\nYour code: <code>${otp}</code>`,
    "HTML",
  );
}

export async function setPartyWebhook(url: string): Promise<boolean> {
  const secret = process.env.TELEGRAM_PARTY_WEBHOOK_SECRET?.trim() || undefined;
  const result = await apiPost<{ ok: boolean }>("setWebhook", {
    url,
    secret_token: secret,
  });
  return result?.ok === true;
}

async function apiPost<T = { ok: boolean }>(
  method: string,
  payload: Record<string, unknown> | FormData,
): Promise<T | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/${method}`, {
      method: "POST",
      headers: payload instanceof FormData ? undefined : { "Content-Type": "application/json" },
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}