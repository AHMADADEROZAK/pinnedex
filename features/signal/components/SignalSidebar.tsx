"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rocket,
  UserRound,
  Handshake,
  BarChart3,
  Megaphone,
  Search,
  Bell,
  Crown,
  CrownIcon,
  Clock,
  PinIcon,
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

const navItems = [
  { href: "/signal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/signal/boosts", label: "Boosts", icon: Rocket },
  { href: "/signal/profiles", label: "Profiles", icon: UserRound },
  { href: "/signal/takeovers", label: "Takeovers", icon: Handshake },
  { href: "/signal/metas", label: "Metas", icon: BarChart3 },
  { href: "/signal/ads", label: "Ads", icon: Megaphone },
  { href: "/signal/search", label: "Search", icon: Search },
  { href: "/signal/alerts", label: "Alerts", icon: Bell },
];

interface SignalSidebarProps {
  memberPath: string;
  isMember: boolean;
  memberExpiresAt: string | null;
}

export function SignalSidebar({
  memberPath,
  isMember,
  memberExpiresAt,
}: SignalSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/signal" />}
              className="data-active:bg-transparent data-active:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <PinIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-xs">DexScreener</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Signal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.href === "/signal"
                    ? pathname === "/signal"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
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

        <SidebarGroup>
          <SidebarGroupLabel>Membership</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname.startsWith(memberPath)}
                  tooltip="Member"
                  render={<Link href={memberPath} />}
                  className={cn(
                    isMember && "text-green-600",
                  )}
                >
                  {isMember ? (
                    <CrownIcon className="size-4" />
                  ) : (
                    <Crown className="size-4 text-amber-500" />
                  )}
                  <span>Member</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {isMember && memberExpiresAt && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>
                  Expires{" "}
                  {new Date(memberExpiresAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/signal/alerts"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
              )}
            >
              <Bell className="size-3" />
              Alert Feed
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}