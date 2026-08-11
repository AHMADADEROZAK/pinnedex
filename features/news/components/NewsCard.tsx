import { ArrowUpRight, Newspaper } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NewsItemView } from "@/features/news/types";

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NewsCard({ item }: { item: NewsItemView }) {
  const hasImage = Boolean(item.enclosureUrl);

  return (
    <Card className="flex flex-col">
      {hasImage && (
        <img
          src={item.enclosureUrl}
          alt={item.title}
          className="aspect-video w-full object-cover"
          loading="lazy"
        />
      )}
      <CardHeader className="gap-1">
        {item.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary"
              >
                {category}
              </span>
            ))}
          </div>
        )}
        <CardTitle>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-3 transition-colors hover:text-primary"
          >
            {item.title}
          </a>
        </CardTitle>
      </CardHeader>
      {item.contentSnippet && (
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.contentSnippet}
          </p>
        </CardContent>
      )}
      <CardFooter className="mt-auto justify-between gap-2 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 truncate">
          <Newspaper className="size-3 shrink-0" />
          <span className="truncate">{item.creator || "Cryptonews"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {formatDate(item.pubDate)}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open article"
          >
            <ArrowUpRight className="size-3" />
          </a>
        </span>
      </CardFooter>
    </Card>
  );
}