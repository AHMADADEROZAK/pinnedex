import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { clerkMiddleware } from "@clerk/nextjs/server";

import { adminBasePath } from "@/lib/admin-path";

const protectedRoutes = ["/profile"];
const authRoutes = ["/login", "/register"];

const WALLET_RE = /^\/([1-9A-HJ-NP-Za-km-z]{32,44})(\/.*)?$/;

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const path = request.nextUrl.pathname;
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)
    ?.role;

  const secretBase = adminBasePath();
  const isSecretPath =
    path === secretBase || path.startsWith(`${secretBase}/`);
  const isAdminInternal = path === "/admin" || path.startsWith("/admin/");
  const isProtected = protectedRoutes.some(
    (r) => path === r || path.startsWith(`${r}/`),
  );
  const isAuthRoute = authRoutes.includes(path);

  const walletMatch = path.match(WALLET_RE);
  const isMemberSecretPath = walletMatch !== null;
  const isMemberInternal =
    path === "/member" || path.startsWith("/member/");

  if (isSecretPath) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "admin") {
      return new NextResponse("Not found", { status: 404 });
    }
    const target = `${path.replace(secretBase, "/admin")}`;
    return NextResponse.rewrite(new URL(target, request.url));
  }

  if (isMemberSecretPath) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const wallet = walletMatch![1];
    const rest = walletMatch![2] ?? "";

    const url = new URL(`/member${rest}`, request.url);
    for (const [key, value] of request.nextUrl.searchParams) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set("w", wallet);

    const res = NextResponse.rewrite(url);
    res.cookies.set("member-wallet", wallet, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  if (isAdminInternal) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (isMemberInternal) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (isProtected && !userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && userId) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
    "/__clerk/:path*",
  ],
};
