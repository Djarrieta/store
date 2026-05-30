"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { setWaRefCookie } from "@/app/actions/chat-migration";
import Button from "@/app/components/Button";
import { createClient } from "@/lib/supabase/client";

const DEV_EMAIL = process.env.NEXT_PUBLIC_DEV_USER_EMAIL;
const DEV_PASSWORD = process.env.NEXT_PUBLIC_DEV_USER_PASSWORD;
const SHOW_DEV_LOGIN =
  process.env.NODE_ENV !== "production" && Boolean(DEV_EMAIL && DEV_PASSWORD);

export default function LoginActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDevLoading, setIsDevLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const next = searchParams.get("next") ?? "/";
  const waRef = searchParams.get("wa_ref");

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    // If wa_ref is present, persist it as an HttpOnly cookie before OAuth redirect
    if (waRef) {
      try {
        await setWaRefCookie(waRef);
      } catch {
        // non-fatal — proceed with login anyway
      }
    }

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

  const loginAsDev = async () => {
    if (!DEV_EMAIL || !DEV_PASSWORD) return;
    setIsDevLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
    if (signInError) {
      setError(signInError.message);
      setIsDevLoading(false);
      return;
    }
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    router.replace(safeNext);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button variant="primary" size="lg" fullWidth onClick={loginWithGoogle} disabled={isLoading}>
        Continuar con Google
      </Button>

      {SHOW_DEV_LOGIN ? (
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={loginAsDev}
          disabled={isDevLoading}
        >
          Dev login ({DEV_EMAIL})
        </Button>
      ) : null}

      {error ? <p className="text-sm text-[var(--error-text)]">{error}</p> : null}
    </div>
  );
}
