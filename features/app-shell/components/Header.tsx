import Image from "next/image";
import Link from "next/link";

import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { WalletBalance } from "@/features/wallet/components/WalletBalance";
import { getSessionUser } from "@/lib/dal";
import { HeaderNav, type HeaderLink } from "./HeaderNav";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const user = await getSessionUser();

  const firstWallet = user?.wallets?.[0]?.address;

  const navLinks: (HeaderLink & { auth?: boolean })[] = [
    { href: "/features", label: "Features", icon: "features" },
    { href: "/news", label: "News", icon: "news" },
    { href: "/community", label: "Community", icon: "community" },
    { href: "/presale", label: "Presale", icon: "presale" },
    { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
    { href: "/party-room", label: "Party Room", icon: "party-room" },
    ...(firstWallet
      ? ([
          {
            href: `/${firstWallet}`,
            label: "Signal",
            icon: "signal",
            auth: true,
          },
        ] satisfies (HeaderLink & { auth: true })[])
      : []),
    { href: "/profile", label: "Profile", icon: "profile", auth: true },
  ];

  const visibleLinks = user
    ? navLinks
    : navLinks.filter((link) => !link.auth);

  return (
    <header className="sticky top-0 z-50 border-b bg-background px-4 py-2 md:px-8">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/pinesuru.png"
            alt="Pinnedex"
            width={351}
            height={351}
            className="h-7 w-auto rounded"
          />
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Pinnedex
          </h1>
        </Link>
        <div className="hidden justify-center md:flex">
          <HeaderNav links={visibleLinks} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <WalletBalance />
            <ConnectWallet />
          </div>
          <MobileNav links={visibleLinks} />
        </div>
      </div>
    </header>
  );
}
