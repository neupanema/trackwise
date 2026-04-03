// middleware.ts (in root folder same level as package.json)
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                     req.nextUrl.pathname.startsWith("/signup") ||
                     req.nextUrl.pathname.startsWith("/onboarding");

  // not logged in + trying to access dashboard = redirect to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // logged in + trying to access login/signup = redirect to dashboard
  if (isLoggedIn && isAuthPage &&
      !req.nextUrl.pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};