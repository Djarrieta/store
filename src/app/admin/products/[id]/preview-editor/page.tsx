import { notFound } from "next/navigation";

import Breadcrumb from "@/app/components/Breadcrumb";
import { createClient } from "@/lib/supabase/server";
import type { CustomizationKind, PrintTemplate, Product } from "@/types";

import PreviewEditor, { type EditorVariant } from "./PreviewEditor";

interface ItemRow {
  id: string;
  stock: number;
  item_categories: Array<{ category: { id: string; name: string } | null }>;
  print_template: PrintTemplate | null;
}

export default async function PreviewEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: rawItems }] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, customizable, customization_kind")
      .eq("id", id)
      .single<Pick<Product, "id" | "title" | "customizable" | "customization_kind">>(),
    supabase
      .from("items")
      .select(
        "id, stock, item_categories(category:category_id(id, name)), print_template:print_templates(*)",
      )
      .eq("product_id", id)
      .order("created_at"),
  ]);

  if (!product) notFound();

  const items = (rawItems as ItemRow[] | null) ?? [];
  const kind = (product.customization_kind ?? null) as CustomizationKind | null;

  const variants: EditorVariant[] = items
    .filter((item) => !!item.print_template)
    .map((item) => {
      const tpl = item.print_template!;
      const label =
        item.item_categories
          .map((ic) => ic.category?.name)
          .filter(Boolean)
          .join(" / ") || tpl.label;
      return {
        itemId: item.id,
        label,
        template: tpl,
        mockupUrl: tpl.mockup_path
          ? supabase.storage.from("print-templates").getPublicUrl(tpl.mockup_path).data.publicUrl
          : null,
        maskUrl: tpl.mask_path
          ? supabase.storage.from("print-templates").getPublicUrl(tpl.mask_path).data.publicUrl
          : null,
      };
    });

  return (
    <section className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Productos", href: "/admin/products" },
          { label: product.title, href: `/admin/products/${id}/edit` },
          { label: "Sandbox del editor" },
        ]}
      />
      <header className="space-y-1">
        <h1 className="font-display text-3xl font-bold">Sandbox del editor</h1>
        <p className="text-sm text-[var(--muted)]">
          Sube una imagen de prueba y verifica cómo se verá la personalización con cada
          plantilla. Nada se sube ni guarda — todo es local al navegador.
        </p>
      </header>

      {!product.customizable || !kind ? (
        <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          Este producto no es personalizable. Actívalo desde la página de edición.
        </div>
      ) : variants.length === 0 ? (
        <div className="rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
          Aún no hay variaciones con plantilla. Crea una variación y configura su plantilla
          de impresión antes de previsualizar.
        </div>
      ) : (
        <PreviewEditor kind={kind} variants={variants} />
      )}
    </section>
  );
}
