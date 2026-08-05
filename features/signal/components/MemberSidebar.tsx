"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Rocket,
  Handshake,
  BarChart3,
  Search,
  Bell,
  Send,
  Activity,
  Crown,
  CrownIcon,
  Clock,
  Globe,
  TagPlusIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface MemberSidebarProps {
  wallet: string;
  isMember: boolean;
  memberExpiresAt: string | null;
}

export function MemberSidebar({
  wallet,
  isMember,
  memberExpiresAt,
}: MemberSidebarProps) {
  const pathname = usePathname();
  if (!wallet) return null;

  const base = `/${wallet}`;

  const navItems = [
    { href: base, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/boosts`, label: "Boosts", icon: Rocket },
    { href: `${base}/profiles`, label: "Profiles", icon: TagPlusIcon },
    { href: `${base}/takeovers`, label: "Takeovers", icon: Handshake },
    { href: `${base}/metas`, label: "Metas", icon: BarChart3 },
    { href: `${base}/search`, label: "Search", icon: Search },
    { href: `${base}/signals`, label: "Signals", icon: Activity, member: true },
    { href: `${base}/alerts`, label: "Alerts", icon: Bell },
    { href: `${base}/member`, label: "Telegram", icon: Send, member: true },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={base} />}
              className="data-active:bg-transparent data-active:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {isMember ? (
                  <CrownIcon className="size-4" />
                ) : (
                  <Crown className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading font-semibold">
                  Pinnedex
                </span>
                {isMember ? (
                  <span className="truncate text-xs text-green-600">Member</span>
                ) : (
                  <span className="truncate text-xs">Free</span>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.href === base
                    ? pathname.endsWith(wallet) || pathname === `/${wallet}`
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      className={cn(
                        item.member && isMember && "text-green-600",
                        item.member && !isMember && "text-amber-500",
                      )}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isMember && memberExpiresAt && (
          <SidebarGroup>
            <SidebarGroupLabel>Membership</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <MembershipCountdown expiresAt={memberExpiresAt} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Community"
              render={<Link href="/community" />}
            >
              <Globe className="size-4" />
              <span>Community</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

function MembershipCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const ms = new Date(expiresAt).getTime() - now;

  return (
    <SidebarMenuButton className="cursor-default hover:bg-transparent active:bg-transparent">
      <Clock className="size-4" />
      {ms > 0 ? (
        <span>
          Expires in{" "}
          <span className="font-medium text-sidebar-foreground">
            {formatRemaining(ms)}
          </span>
        </span>
      ) : (
        <span className="text-red-500">Expired</span>
      )}
    </SidebarMenuButton>
  );
}