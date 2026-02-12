import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const token = req.nextUrl.searchParams.get("token");

    if (token !== process.env.ADMIN_TOKEN) {
      return new NextResponse("Acesso negado", { status: 401 });
    }
  }

  return NextResponse.next();
}
