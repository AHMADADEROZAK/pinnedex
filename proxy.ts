import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decrypt } from "@/lib/session";
import { adminBasePath } from "@/lib/admin-path";

const protectedRoutes = ["/app", "/profile"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cookie = request.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  const secretBase = adminBasePath();
  const isSecretPath =
    path === secretBase || path.startsWith(`${secretBase}/`);
  const isAdminInternal = path === "/admin" || path.startsWith("/admin/");
  const isProtected = protectedRoutes.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  const isAuthRoute = authRoutes.includes(path);

  if (isSecretPath) {
    if (!session?.userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin") {
      return new NextResponse("Not found", { status: 404 });
    }
    const target = `${path.replace(secretBase, "/admin")}`;
    return NextResponse.rewrite(new URL(target, request.url));
  }

  if (isAdminInternal) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
