"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface HeaderLink {
  href: string;
  label: string;
}

export function HeaderNav({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            pathname.startsWith(link.href) && "bg-muted font-medium text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
