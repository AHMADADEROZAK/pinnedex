import { Newspaper } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { NewsFeed } from "@/features/news/models/NewsFeed";
import { NewsList } from "@/features/news/components/NewsList";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { NewsItemView } from "@/features/news/types";

const NEWS_PAGE_LIMIT = 50;

export default async function MemberNewsPage() {
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
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Newspaper className="size-6 text-primary" />
          Crypto News
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length} headlines synced from Cointelegraph
        </p>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <ErrorState message="No news items yet. The feed refreshes in a few minutes." />
      ) : (
        <NewsList items={items} />
      )}
    </div>
  );
}
