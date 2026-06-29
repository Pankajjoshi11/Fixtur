import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;

  if (!session) {
    if (req.nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }
    if (req.nextUrl.pathname.startsWith("/cricket/live/login") || req.nextUrl.pathname.startsWith("/cricket/live/signup")) {
      return NextResponse.next();
    }
  }

  if (session) {
    try {
      const { payload } = await jwtVerify(session, secret);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-email", payload.email as string);

      // Removed Prisma call to avoid Edge Runtime error.
      // The user role can be added to the JWT payload during login if needed.
      requestHeaders.set("x-user-role", "USER");

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
