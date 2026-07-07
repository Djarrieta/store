import { redirect } from "next/navigation";
import { Suspense } from "react";

import Logo from "@/app/components/Logo";
import { getUser } from "@/lib/auth";

import LoginActions from "./LoginActions";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <section className="mx-auto max-w-md rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
      <div className="mb-6 flex justify-center">
        <Logo height={56} priority />
      </div>
      <h1 className="text-center font-display text-3xl font-medium tracking-tight">Bienvenido</h1>
      <p className="mt-2 text-center text-sm text-[var(--muted)]">Inicia sesión para gestionar tus pedidos y perfil.</p>
      <div className="mt-5">
        <Suspense>
          <LoginActions />
        </Suspense>
      </div>
    </section>
  );
}
