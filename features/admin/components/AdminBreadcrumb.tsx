"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const titles: Record<string, string> = {
  "": "Dashboard",
  users: "Users",
  purchases: "Purchases",
  pins: "Community Pins",
  bans: "Bans",
  "dex-usage": "Dex Usage",
};

export function AdminBreadcrumb({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  const segment = pathname.replace(basePath, "").replace(/^\/+/, "");
  const title = titles[segment] ?? "Admin";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink render={<a href={basePath} />}>Admin</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
