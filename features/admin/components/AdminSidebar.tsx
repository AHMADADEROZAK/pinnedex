"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShoppingCart, ShieldBan } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/admin/bans", label: "Bans", icon: ShieldBan },
];

export function AdminSidebar({ basePath }: { basePath: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-1 border-r bg-muted/30 p-3 lg:w-52">
      <p className="px-3 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Admin
      </p>
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const href = `${basePath}${link.href.replace("/admin", "")}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={link.href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-muted font-medium text-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
