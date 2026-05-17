import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createAddress } from "../../actions";
import Button from "@/app/components/Button";
import Breadcrumb from "@/app/components/Breadcrumb";
import Input, { Checkbox } from "@/app/components/Input";
import { Form, FormField, FormActions } from "@/app/components/FormCard";

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
        className="space-y-4 rounded-2xl border-2 border-black bg-[var(--card)] p-6 shadow-[4px_4px_0_0_#111]"
      >
        <FormField label="Nombre del destinatario" htmlFor="recipient_name">
          <Input
            id="recipient_name"
            name="recipient_name"
            required
            placeholder="ej. María García"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento">
            <Input
              name="department"
              required
              placeholder="ej. Antioquia"
            />
          </FormField>
          <FormField label="Ciudad">
            <Input
              name="city"
              required
              placeholder="ej. Medellín"
            />
          </FormField>
        </div>

        <FormField label="Dirección" htmlFor="address_line">
          <Input
            id="address_line"
            name="address_line"
            required
            placeholder="ej. Cra 7 # 45-20 Apto 301"
          />
        </FormField>

        <FormField
          label={<>Barrio <span className="font-normal text-[var(--muted)]">(opcional)</span></>}
          htmlFor="neighborhood"
        >
          <Input
            id="neighborhood"
            name="neighborhood"
            placeholder="ej. El Poblado"
          />
        </FormField>

        <FormField label="Teléfono de contacto" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            required
            type="tel"
            placeholder="ej. 300 123 4567"
          />
        </FormField>

        <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium">
          <Checkbox
            name="is_default"
            value="true"
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
