"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { navIcons, type NavIconName } from "./nav-icons";

export interface HeaderLink {
  href: string;
  label: string;
  icon: NavIconName;
  children?: HeaderLink[];
}

const underlineEffect = cn(
  "group relative",
  "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary after:origin-left after:scale-x-0 after:transition-transform after:duration-300",
  "hover:after:scale-x-100",
);

function isActive(pathname: string, link: HeaderLink): boolean {
  if (pathname.startsWith(link.href)) return true;
  return link.children?.some((c) => pathname.startsWith(c.href)) ?? false;
}

export function HeaderNav({ links }: { links: HeaderLink[] }) {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map((link) => {
          const Icon = navIcons[link.icon];
          const active = isActive(pathname, link);

          if (link.children?.length) {
            return (
              <NavigationMenuItem key={link.label}>
                <NavigationMenuTrigger
                  className={cn(
                    underlineEffect,
                    "hover:bg-transparent focus:bg-transparent data-[popup-open]:bg-transparent",
                    active && "font-medium text-foreground after:scale-x-100",
                  )}
                >
                  <span className="size-3.5 shrink-0 text-muted-foreground">
                    <Icon className="size-full" />
                  </span>
                  {link.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-52 gap-0.5 p-1">
                    {link.children.map((child) => {
                      const ChildIcon = navIcons[child.icon];
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <li key={child.href}>
                          <NavigationMenuLink
                            render={<Link href={child.href} />}
                            className={cn(
                              childActive &&
                                "bg-muted/50 font-medium text-foreground",
                            )}
                          >
                            <span className="size-3.5 shrink-0 text-muted-foreground">
                              <ChildIcon className="size-full" />
                            </span>
                            {child.label}
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={link.href}>
              <NavigationMenuLink
                render={<Link href={link.href} />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  underlineEffect,
                  "hover:bg-transparent focus-visible:bg-transparent data-[active=true]:bg-transparent",
                  active &&
                    "bg-transparent font-medium text-foreground after:scale-x-100",
                )}
              >
                <span className="size-3.5 shrink-0 text-muted-foreground">
                  <Icon className="size-full" />
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
