"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const next = searchParams.get("next") ?? "/";

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const origin = window.location.origin;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={isLoading}
        className="w-full rounded-lg border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-semibold"
      >
        Continue with Google
      </button>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
