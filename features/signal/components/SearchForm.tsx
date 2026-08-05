"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SearchForm({ wallet }: { wallet: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const base = wallet ? `/${wallet}` : "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) {
          router.push(
            `${base}/search?q=${encodeURIComponent(q.trim())}`,
          );
        }
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search pairs by token name, symbol, or address..."
        className="flex h-9 w-full max-w-md rounded-md border bg-background px-3 py-1 text-sm"
      />
      <Button type="submit" size="sm" className="gap-1">
        <Search className="size-4" />
        Search
      </Button>
    </form>
  );
}