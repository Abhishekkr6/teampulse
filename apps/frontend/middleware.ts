import { NextResponse } from "next/server";

import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value || req.headers.get("authorization");
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
