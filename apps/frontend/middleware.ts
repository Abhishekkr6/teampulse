import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");

  // If token present, set secure httpOnly cookie but do not redirect.
  // Let client JS strip the query and set localStorage synchronously.
  if (tokenParam) {
    const res = NextResponse.next();
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
