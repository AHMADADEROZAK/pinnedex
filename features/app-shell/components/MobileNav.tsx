"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { WalletBalance } from "@/features/wallet/components/WalletBalance";
import type { HeaderLink } from "./HeaderNav";
import { navIcons } from "./nav-icons";

export function MobileNav({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="md:hidden"
          >
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="flex flex-col" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image
              src="/pinesuru.png"
              alt="Pinnedex"
              width={351}
              height={351}
              className="h-5 w-auto rounded"
            />
            Pinnedex
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = navIcons[link.icon];
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100",
                  active && "font-medium text-foreground after:scale-x-100",
                )}
              >
                <span className="size-3.5 shrink-0 text-muted-foreground">
                  <Icon className="size-full" />
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t p-4">
          <WalletBalance />
          <ConnectWallet />
        </div>
      </SheetContent>
    </Sheet>
  );
}