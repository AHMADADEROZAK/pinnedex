import Link from "next/link";
import { PinIcon } from "lucide-react";

import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { WalletBalance } from "@/features/wallet/components/WalletBalance";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { getSessionUser } from "@/lib/dal";
import { HeaderNav, type HeaderLink } from "./HeaderNav";

export async function Header() {
  const user = await getSessionUser();

  const firstWallet = user?.wallets?.[0]?.address;

  const navLinks: (HeaderLink & { auth?: boolean })[] = [
    { href: "/community", label: "Community" },
    { href: "/presale", label: "Presale" },
    { href: "/leaderboard", label: "Leaderboard" },
    ...(firstWallet
      ? [{ href: `/${firstWallet}`, label: "Signal", auth: true }]
      : []),
    { href: "/profile", label: "Profile", auth: true },
  ];

  const visibleLinks = user
    ? navLinks
    : navLinks.filter((link) => !link.auth);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background px-8 py-2">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <PinIcon className="size-5 text-primary" />
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Pinnedex
          </h1>
        </Link>
        <HeaderNav links={visibleLinks} />
      </div>
      <div className="flex items-center gap-2">
        <WalletBalance />
        <ConnectWallet />
        <ThemeToggle />
      </div>
    </header>
  );
}
