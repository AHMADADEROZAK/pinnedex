import { connectToDatabase } from "@/lib/mongodb";
import { NewsFeed } from "@/features/news/models/NewsFeed";

const SYNC_INTERVAL_MS = Number(process.env.NEWS_SYNC_INTERVAL_MS ?? 30 * 60_000);

function newsWebhookUrl(): string {
  return process.env.NEWS_WEBHOOK_URL?.trim() ?? "";
}

function toDate(value: unknown): Date | undefined {
  if (typeof value !== "string" && !(value instanceof Date)) return undefined;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toCategories(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((c): c is string => typeof c === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function toEnclosure(value: unknown): { url: string; length?: string; type?: string } | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const url = toStringValue(obj.url).trim();
  if (!url) return undefined;
  return {
    url,
    length: toStringValue(obj.length),
    type: toStringValue(obj.type),
  };
}

export interface RawNewsItem extends Record<string, unknown> {}

function normalizeItem(raw: RawNewsItem): {
  guid: string;
  title: string;
  link: string;
  creator: string;
  categories: string[];
  content: string;
  contentSnippet: string;
  enclosure?: { url: string; length?: string; type?: string };
  pubDate?: Date;
  isoDate?: Date;
  seenAt: Date;
} {
  const creator = toStringValue(raw["dc:creator"] ?? raw.creator);
  const guid = toStringValue(raw.guid).trim() || toStringValue(raw.link).trim();
  const seenAt = new Date();

  return {
    guid: guid || `${seenAt.getTime()}-${creator}-${toStringValue(raw.title).trim()}`,
    title: toStringValue(raw.title),
    link: toStringValue(raw.link),
    creator,
    categories: toCategories(raw.categories),
    content: toStringValue(raw.content),
    contentSnippet: toStringValue(raw.contentSnippet),
    enclosure: toEnclosure(raw.enclosure),
    pubDate: toDate(raw.pubDate),
    isoDate: toDate(raw.isoDate),
    seenAt,
  };
}

function extractItems(payload: unknown): RawNewsItem[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is RawNewsItem =>
        !!item && typeof item === "object" && !Array.isArray(item),
    );
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["items", "data", "results"]) {
      const value = obj[key];
      if (Array.isArray(value)) {
        return value.filter(
          (item): item is RawNewsItem =>
            !!item && typeof item === "object" && !Array.isArray(item),
        );
      }
    }
  }
  return [];
}

export async function syncNews(): Promise<{
  source: string;
  received: number;
  matched: number;
  upserted: number;
  modified: number;
}> {
  const source = newsWebhookUrl();
  if (!source) {
    console.warn(`[news] NEWS_WEBHOOK_URL not set, skipping sync`);
    return { source: "", received: 0, matched: 0, upserted: 0, modified: 0 };
  }

  const res = await fetch(source);
  if (!res.ok) {
    throw new Error(`[news] webhook responded ${res.status}`);
  }

  const payload: unknown = await res.json();
  const items = extractItems(payload);
  if (items.length === 0) {
    throw new Error(`[news] webhook returned no items`);
  }

  const docs = items.map(normalizeItem).filter((doc) => doc.guid);

  await connectToDatabase();

  const result = await NewsFeed.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { guid: doc.guid },
        update: { $set: doc },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return {
    source,
    received: items.length,
    matched: result.matchedCount,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
}

let newsTimer: NodeJS.Timeout | null = null;

export function startNewsSync(): void {
  if (!newsWebhookUrl()) {
    console.warn(`[news] NEWS_WEBHOOK_URL not set, news sync disabled`);
    return;
  }

  const run = async () => {
    try {
      const summary = await syncNews();
      console.log(
        `[news] synced ${summary.received} item(s) from n8n (upserted ${summary.upserted}, modified ${summary.modified})`,
      );
    } catch (err) {
      console.error(`[news] sync failed`, err);
    }
  };

  run();
  newsTimer = setInterval(run, SYNC_INTERVAL_MS);
  newsTimer.unref?.();
}

export function stopNewsSync(): void {
  if (newsTimer) {
    clearInterval(newsTimer);
    newsTimer = null;
  }
}