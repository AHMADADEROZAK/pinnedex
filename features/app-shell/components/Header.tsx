"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PinIcon } from "lucide-react";

import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { WalletBalance } from "@/features/wallet/components/WalletBalance";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/presale", label: "Presale" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-4 border-b px-8 py-2">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <PinIcon className="size-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            pinnedex
          </h1>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {navLinks.map((link) => (
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
      </div>
      <div className="flex items-center gap-2">
        <WalletBalance />
        <ConnectWallet />
        <ThemeToggle />
      </div>
    </header>
  );
}
