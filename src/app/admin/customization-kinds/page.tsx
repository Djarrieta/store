import Button from "@/app/components/Button";
import { Form } from "@/app/components/FormCard";
import PageHeader from "@/app/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CustomizationKind } from "@/types";

import {
  archiveKind,
  deleteKind,
  unarchiveKind,
} from "./actions";

export default async function AdminCustomizationKindsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: kinds } = await supabase
    .from("customization_kinds")
    .select("*")
    .order("sort_order")
    .order("label")
    .returns<CustomizationKind[]>();

  // Count products per kind so we can disable destructive actions.
  const { data: usage } = await supabase
    .from("products")
    .select("customization_kind_id")
    .not("customization_kind_id", "is", null)
    .returns<{ customization_kind_id: string }[]>();
  const usageMap = new Map<string, number>();
  for (const row of usage ?? []) {
    usageMap.set(
      row.customization_kind_id,
      (usageMap.get(row.customization_kind_id) ?? 0) + 1,
    );
  }

  const rows = kinds ?? [];

  return (
    <PageHeader
      title="Tipos de personalización"
      createHref="/admin/customization-kinds/new"
      createLabel="Nuevo tipo"
      isEmpty={rows.length === 0}
      emptyText="Aún no hay tipos de personalización."
    >
      <div className="overflow-x-auto rounded-xl border-2 border-[var(--border)] bg-[var(--card)] shadow-[3px_3px_0_0_var(--shadow)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b-2 border-[var(--border)] bg-[var(--accent)] text-[var(--accent-foreground)]">
            <tr>
              <th className="p-3 text-left font-bold">Nombre</th>
              <th className="p-3 text-left font-bold">Slug</th>
              <th className="p-3 text-right font-bold">Campos</th>
              <th className="p-3 text-right font-bold">Productos</th>
              <th className="p-3 text-center font-bold">Estado</th>
              <th className="p-3 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((kind) => {
              const productCount = usageMap.get(kind.id) ?? 0;
              return (
                <tr key={kind.id} className="border-b border-[var(--border)]/10 last:border-0">
                  <td className="p-3 font-medium">{kind.label}</td>
                  <td className="p-3 font-mono text-xs">{kind.slug}</td>
                  <td className="p-3 text-right">
                    {kind.attribute_schema?.length ?? 0}
                  </td>
                  <td className="p-3 text-right">{productCount}</td>
                  <td className="p-3 text-center">
                    {kind.archived ? (
                      <span className="rounded-md bg-[var(--muted)]/20 px-2 py-1 text-xs font-bold uppercase">
                        Archivado
                      </span>
                    ) : (
                      <span className="rounded-md bg-[var(--ok-bg)] px-2 py-1 text-xs font-bold uppercase text-[var(--ok-text)]">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        href={`/admin/customization-kinds/${kind.id}/edit`}
                        variant="secondary"
                        size="sm"
                        shadow
                      >
                        Editar
                      </Button>
                      {kind.archived ? (
                        <Form
                          className="flex items-center"
                          action={async () => {
                            "use server";
                            await unarchiveKind(kind.id);
                          }}
                        >
                          <Button variant="secondary" size="sm" shadow type="submit">
                            Reactivar
                          </Button>
                        </Form>
                      ) : (
                        <Form
                          className="flex items-center"
                          action={async () => {
                            "use server";
                            await archiveKind(kind.id);
                          }}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            shadow
                            type="submit"
                            disabled={productCount > 0}
                            confirm
                          >
                            Archivar
                          </Button>
                        </Form>
                      )}
                      <Form
                        className="flex items-center"
                        action={async () => {
                          "use server";
                          await deleteKind(kind.id);
                        }}
                      >
                        <Button
                          variant="danger"
                          size="sm"
                          shadow
                          type="submit"
                          disabled={productCount > 0}
                          confirm
                        >
                          Eliminar
                        </Button>
                      </Form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageHeader>
  );
}
