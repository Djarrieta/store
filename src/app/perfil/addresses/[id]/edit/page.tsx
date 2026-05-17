import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";
import { updateAddress } from "../../../actions";
import Button from "@/app/components/Button";
import Breadcrumb from "@/app/components/Breadcrumb";
import Input from "@/app/components/Input";
import { FormField, FormActions } from "@/app/components/FormCard";

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
      <Breadcrumb
        items={[
          { label: "Mi perfil", href: "/perfil" },
          { label: "Editar dirección" },
        ]}
      />

      <h1 className="font-display text-2xl font-bold">Editar dirección</h1>

      <form
        action={updateAndRedirectWrapper}
        className="space-y-4 rounded-2xl border-2 border-black bg-[var(--card)] p-6 shadow-[4px_4px_0_0_#111]"
      >
        <FormField label="Nombre del destinatario" htmlFor="recipient_name">
          <Input
            id="recipient_name"
            name="recipient_name"
            required
            defaultValue={address.recipient_name}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Departamento
            <Input
              name="department"
              required
              defaultValue={address.department}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Ciudad
            <Input
              name="city"
              required
              defaultValue={address.city}
            />
          </label>
        </div>

        <FormField label="Dirección" htmlFor="address_line">
          <Input
            id="address_line"
            name="address_line"
            required
            defaultValue={address.address_line}
          />
        </FormField>

        <div className="grid gap-1 text-sm font-medium">
          <label htmlFor="neighborhood">
            Barrio{" "}
            <span className="font-normal text-[var(--muted)]">(opcional)</span>
          </label>
          <Input
            id="neighborhood"
            name="neighborhood"
            defaultValue={address.neighborhood ?? ""}
          />
        </div>

        <FormField label="Teléfono de contacto" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            required
            type="tel"
            defaultValue={address.phone}
          />
        </FormField>

        <FormActions>
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
            Guardar cambios
          </Button>
        </FormActions>
      </form>
    </main>
  );
}
