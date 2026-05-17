import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types";
import { updateAddress } from "../../../actions";
import Button from "@/app/components/Button";
import Breadcrumb from "@/app/components/Breadcrumb";
import Input from "@/app/components/Input";
import { Form, FormActions } from "@/app/components/FormCard";

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

      <Form
        action={updateAndRedirectWrapper}
        className="space-y-4 rounded-2xl border-2 border-black bg-[var(--card)] p-6 shadow-[4px_4px_0_0_#111]"
      >
        <Input
          label="Nombre del destinatario"
          name="recipient_name"
          required
          defaultValue={address.recipient_name}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Departamento" name="department" required defaultValue={address.department} />
          <Input label="Ciudad" name="city" required defaultValue={address.city} />
        </div>

        <Input
          label="Dirección"
          name="address_line"
          required
          defaultValue={address.address_line}
        />

        <Input
          label={<>Barrio <span className="font-normal text-[var(--muted)]">(opcional)</span></>}
          name="neighborhood"
          defaultValue={address.neighborhood ?? ""}
        />

        <Input
          label="Teléfono de contacto"
          name="phone"
          required
          type="tel"
          defaultValue={address.phone}
        />

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
      </Form>
    </main>
  );
}
