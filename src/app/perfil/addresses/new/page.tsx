import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createAddress } from "../../actions";
import Button from "@/app/components/Button";

export default async function NewAddressPage() {
  await requireAuth();

  async function createAndRedirect(formData: FormData) {
    "use server";
    await createAddress(formData);
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

      <h1 className="font-display text-2xl font-bold">Nueva dirección</h1>

      <form
        action={createAndRedirect}
        className="space-y-4 rounded-2xl border-2 border-black bg-[var(--card)] p-6 shadow-[4px_4px_0_0_#111]"
      >
        <label className="grid gap-1 text-sm font-medium">
          Nombre del destinatario
          <input
            name="recipient_name"
            required
            placeholder="ej. María García"
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Departamento
            <input
              name="department"
              required
              placeholder="ej. Antioquia"
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Ciudad
            <input
              name="city"
              required
              placeholder="ej. Medellín"
              className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-medium">
          Dirección
          <input
            name="address_line"
            required
            placeholder="ej. Cra 7 # 45-20 Apto 301"
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Barrio{" "}
          <span className="font-normal text-[var(--muted)]">(opcional)</span>
          <input
            name="neighborhood"
            placeholder="ej. El Poblado"
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Teléfono de contacto
          <input
            name="phone"
            required
            type="tel"
            placeholder="ej. 300 123 4567"
            className="w-full rounded-md border-2 border-black px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="is_default"
            value="true"
            className="h-4 w-4 rounded border-2 border-black"
          />
          Usar como dirección principal
        </label>

        <div className="flex gap-3 pt-1">
          <Button href="/perfil" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="xl"
            shadow
            type="submit"
            className="flex-1"
          >
            Guardar dirección
          </Button>
        </div>
      </form>
    </main>
  );
}
