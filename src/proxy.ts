import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isAuthenticated = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Already authenticated — redirect away from login page
  if (pathname === "/login" && isAuthenticated) {
    const dest = role === "REVIEWER" ? "/queue" : "/intake";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Root → redirect based on session
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const dest = role === "REVIEWER" ? "/queue" : "/intake";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Protected pages — must be authenticated
  if (pathname.startsWith("/intake") || pathname.startsWith("/queue")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access: patients can't access /queue, reviewers can't access /intake
    if (pathname.startsWith("/queue") && role !== "REVIEWER") {
      return NextResponse.redirect(new URL("/intake", req.url));
    }
    if (pathname.startsWith("/intake") && role !== "PATIENT") {
      return NextResponse.redirect(new URL("/queue", req.url));
    }
  }

  // Protected API routes — require authentication
  if (pathname.startsWith("/api/intakes") || pathname.startsWith("/api/users")) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run proxy on all routes except Next.js internals, static files, and auth endpoints
  matcher: ["/((?!_next/static|_next/image|favicon.ico|design-inspiration).*)"],
};
