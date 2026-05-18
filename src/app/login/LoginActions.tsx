"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import Button from "@/app/components/Button";
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
      <Button variant="primary" size="lg" fullWidth onClick={loginWithGoogle} disabled={isLoading}>
        Continuar con Google
      </Button>

      {error ? <p className="text-sm text-[var(--error-text)]">{error}</p> : null}
    </div>
  );
}
