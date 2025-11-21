import { NextResponse } from "next/server";

import { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value || req.headers.get("authorization");

  // BUT for now — simply check localStorage in client-side redirect.
  // Middleware cannot read localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
