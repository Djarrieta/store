import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name:
          user.user_metadata?.full_name ?? user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "",
        avatar_url: user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "id" },
    );
  }

  return NextResponse.redirect(`${requestUrl.origin}${safeNext}`);
}
