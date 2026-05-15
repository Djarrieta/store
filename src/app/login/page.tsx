import { redirect } from "next/navigation";
import LoginActions from "./LoginActions";
import { getUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/");

  return (
    <section className="mx-auto max-w-md rounded-2xl border-4 border-black bg-[var(--card)] p-6 shadow-[6px_6px_0_0_#111]">
      <h1 className="font-display text-3xl font-bold">Welcome Back</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Sign in to manage items and your profile.</p>
      <div className="mt-5">
        <LoginActions />
      </div>
    </section>
  );
}
