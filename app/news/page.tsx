import { Newspaper } from "lucide-react";

import { Header } from "@/features/app-shell";
import { connectToDatabase } from "@/lib/mongodb";
import { NewsFeed } from "@/features/news/models/NewsFeed";
import { NewsList } from "@/features/news/components/NewsList";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { NewsItemView } from "@/features/news/types";

const NEWS_PAGE_LIMIT = 50;

export default async function NewsPage() {
  let error: string | null = null;
  let items: NewsItemView[] = [];

  try {
    await connectToDatabase();
    const docs = await NewsFeed.find()
      .sort({ pubDate: -1, seenAt: -1 })
      .limit(NEWS_PAGE_LIMIT)
      .lean()
      .exec();

    items = docs.map((doc) => ({
      guid: String(doc.guid),
      title: String(doc.title ?? ""),
      link: String(doc.link ?? ""),
      creator: String(doc.creator ?? ""),
      categories: (doc.categories ?? []) as string[],
      contentSnippet: String(doc.contentSnippet ?? ""),
      enclosureUrl: doc.enclosure?.url || undefined,
      pubDate:
        doc.pubDate instanceof Date
          ? doc.pubDate.toISOString()
          : doc.pubDate
            ? String(doc.pubDate)
            : undefined,
    }));
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load crypto news";
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          <Newspaper className="size-6 text-primary" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Crypto News
          </h1>
        </div>
        <p className="-mt-4 text-sm text-muted-foreground">
          {items.length} headlines synced from Cointelegraph
        </p>

        {error ? (
          <ErrorState message={error} />
        ) : items.length === 0 ? (
          <ErrorState message="No news items yet. The feed refreshes in a few minutes." />
        ) : (
          <NewsList items={items} />
        )}
      </main>
    </div>
  );
}