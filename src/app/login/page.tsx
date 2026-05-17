import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUser } from "@/lib/auth";

import LoginActions from "./LoginActions";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <section className="mx-auto max-w-md rounded-2xl border-4 border-black bg-[var(--card)] p-6 shadow-[6px_6px_0_0_#111]">
      <h1 className="font-display text-3xl font-bold">Bienvenido</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Inicia sesión para gestionar tus pedidos y perfil.</p>
      <div className="mt-5">
        <Suspense>
          <LoginActions />
        </Suspense>
      </div>
    </section>
  );
}
