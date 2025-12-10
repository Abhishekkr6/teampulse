import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");

  // If token present in query, set it as httpOnly cookie on frontend domain
  if (tokenParam) {
    const res = NextResponse.redirect(new URL(url.pathname, req.url));
    res.cookies.set("token", tokenParam, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
  ],
};
