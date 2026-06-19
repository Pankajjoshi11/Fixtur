import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
    //return NextResponse.redirect(new URL("/cricket/live/login", req.url));
  }

  if (session) {
    try {
      const { payload } = await jwtVerify(session, secret);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-user-email", payload.email as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (err) {
      console.error("Invalid token", err);
      //return NextResponse.redirect(new URL("/cricket/live/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
