import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decrypt } from "@/lib/session";

const protectedRoutes = ["/app", "/profile"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cookie = request.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  const isProtected = protectedRoutes.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  const isAuthRoute = authRoutes.includes(path);

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
