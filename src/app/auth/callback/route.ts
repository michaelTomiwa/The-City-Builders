import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";

/** Where email links (password reset, confirm email) land: sign the person in, then send them on. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/me";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/join?error=${encodeURIComponent("That link has expired. Please try again.")}`, url.origin));
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
