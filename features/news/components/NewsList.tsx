"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { NewsItemView } from "@/features/news/types";
import { NewsCard } from "./NewsCard";

export function NewsList({ items }: { items: NewsItemView[] }) {
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const c of item.categories) set.add(c);
    }
    return Array.from(set).sort();
  }, [items]);

  const filtered = category
    ? items.filter((item) => item.categories.includes(category))
    : items;

  return (
    <div className="flex flex-col gap-6">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            data-active={!category || undefined}
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all hover:bg-muted",
              "data-active:border-transparent data-active:bg-primary data-active:text-primary-foreground",
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              data-active={category === c || undefined}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all hover:bg-muted",
                "data-active:border-transparent data-active:bg-primary data-active:text-primary-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <NewsCard key={item.guid} item={item} />
        ))}
      </div>
    </div>
  );
}