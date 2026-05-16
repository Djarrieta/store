import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";
import { updateAddress } from "../../../actions";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: address } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Address>();

  if (!address) notFound();

  const updateAndRedirect = updateAddress.bind(null, id);

  async function updateAndRedirectWrapper(formData: FormData) {
    "use server";
    await updateAndRedirect(formData);
    redirect("/perfil");
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <Link
          href="/perfil"
          className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--fg)]"
        >
          ← Mi perfil
        </Link>
      </div>

      <h1 className="font-display text-2xl font-bold">Editar dirección</h1>

      <form
        action={updateAndRedirectWrapper}
        className="space-y-4 rounded-2xl border-2 border-black bg-[var(--card)] p-6 shadow-[4px_4px_0_0_#111]"
      >
        <label className="grid gap-1 text-sm font-medium">
          Nombre del destinatario
          <input
            name="recipient_name"
            required
            defaultValue={address.recipient_name}
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Departamento
            <input
              name="department"
              required
              defaultValue={address.department}
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Ciudad
            <input
              name="city"
              required
              defaultValue={address.city}
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Dirección
          <input
            name="address_line"
            required
            defaultValue={address.address_line}
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Barrio{" "}
          <span className="font-normal text-[var(--muted)]">(opcional)</span>
          <input
            name="neighborhood"
            defaultValue={address.neighborhood ?? ""}
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Teléfono de contacto
          <input
            name="phone"
            required
            type="tel"
            defaultValue={address.phone}
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="flex gap-3 pt-1">
          <Link
            href="/perfil"
            className="rounded-xl border-2 border-black bg-white px-5 py-2.5 text-sm font-semibold shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-xl border-2 border-black bg-[var(--accent)] px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </main>
  );
}
