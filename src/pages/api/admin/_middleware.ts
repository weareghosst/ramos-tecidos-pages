import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("sb-access-token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}
