"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { navIcons, type NavIconName } from "./nav-icons";

export interface HeaderLink {
  href: string;
  label: string;
  icon: NavIconName;
}

export function HeaderNav({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = navIcons[link.icon];
          return (
            <NavigationMenuItem key={link.href}>
              <NavigationMenuLink
                render={<Link href={link.href} />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "group relative hover:bg-transparent focus-visible:bg-transparent data-[active=true]:bg-transparent",
                  "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:origin-left after:scale-x-0 after:transition-transform after:duration-300",
                  "hover:after:scale-x-100",
                  active && "bg-transparent font-medium text-foreground after:scale-x-100",
                )}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#F9B316] text-white">
                  <Icon className="size-3.5" />
                </span>
                {link.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}