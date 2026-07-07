import { redirect } from "next/navigation";

import Breadcrumb from "@/app/components/Breadcrumb";
import Button from "@/app/components/Button";
import { Form, FormActions } from "@/app/components/FormCard";
import Input, { Checkbox } from "@/app/components/Input";
import { requireAuth } from "@/lib/auth";

import { createAddress } from "../../actions";

export default async function NewAddressPage() {
  await requireAuth();

  async function createAndRedirect(formData: FormData) {
    "use server";
    await createAddress(formData);
    redirect("/perfil");
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Mi perfil", href: "/perfil" },
          { label: "Nueva dirección" },
        ]}
      />

      <h1 className="font-display text-2xl font-bold">Nueva dirección</h1>

      <Form
        action={createAndRedirect}
        className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]"
      >
        <Input
          label="Nombre del destinatario"
          name="recipient_name"
          required
          placeholder="ej. María García"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Departamento" name="department" required placeholder="ej. Antioquia" />
          <Input label="Ciudad" name="city" required placeholder="ej. Medellín" />
        </div>

        <Input
          label="Dirección"
          name="address_line"
          required
          placeholder="ej. Cra 7 # 45-20 Apto 301"
        />

        <Input
          label={<>Barrio <span className="font-normal text-[var(--muted)]">(opcional)</span></>}
          name="neighborhood"
          placeholder="ej. El Poblado"
        />

        <Input
          label="Teléfono de contacto"
          name="phone"
          required
          type="tel"
          placeholder="ej. 300 123 4567"
        />

        <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium">
          <Checkbox
            name="is_default"
            value="true"
            defaultChecked
          />
          Usar como dirección principal
        </label>

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
            Guardar dirección
          </Button>
        </FormActions>
      </Form>
    </main>
  );
}
