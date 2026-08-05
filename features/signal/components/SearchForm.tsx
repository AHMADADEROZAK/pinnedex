"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function SearchForm({ wallet }: { wallet: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const base = wallet ? `/${wallet}` : "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) {
          router.push(`${base}/search?q=${encodeURIComponent(q.trim())}`);
        }
      }}
      className="max-w-md"
    >
      <InputGroup>
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pairs by token name, symbol, or address..."
        />
        <InputGroupButton
          type="submit"
          className="mr-1"
          aria-label="Search"
        >
          <Search className="size-4" />
          Search
        </InputGroupButton>
      </InputGroup>
    </form>
  );
}