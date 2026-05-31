import { notFound } from "next/navigation";
import { Suspense } from "react";

import Breadcrumb from "@/app/components/Breadcrumb";
import type { EditorVariant } from "@/app/components/customization/types";
import ProductCard from "@/app/components/ProductCard";
import { isFeatureEnabled } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomizationKind,
  ItemWithCategories,
  PrintTemplate,
  ProductWithCategory,
} from "@/types";

import CustomizationFlow from "./CustomizationFlow";

type ProductDetail = ProductWithCategory & {
  customization_kind: CustomizationKind | null;
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: product }, { data: rawItems }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, category:category_id(*, parent:parent_id(*)), customization_kind:customization_kind_id(*)",
      )
      .eq("id", id)
      .eq("ocultar", false)
      .single<ProductDetail>(),
    supabase
      .from("items")
      .select(
        "id, stock, item_categories(category:category_id(id, name, parent_id, parent:parent_id(id, name))), print_template:print_templates(*)",
      )
      .eq("product_id", id),
  ]);
  const items = rawItems as ItemWithCategories[] | null;

  if (!product) notFound();

  const effectivePrice =
    product.discount > 0
      ? product.price * (1 - product.discount / 100)
      : null;

  const payablePrice = effectivePrice ?? product.price;
  const amountInCents = Math.round(payablePrice * 100);

  const itemList = items ?? [];
  const isPurchasable = itemList.some((i) => i.stock > 0);

  const customizableFlag = await isFeatureEnabled("customizable_products");
  if (!customizableFlag && product.customizable) notFound();
  const isCustomizable =
    customizableFlag && product.customizable && product.customization_kind !== null;
  const customizationVariants: EditorVariant[] = isCustomizable
    ? itemList
        .filter((item): item is ItemWithCategories & { print_template: PrintTemplate } => {
          return !!item.print_template && item.stock > 0;
        })
        .map((item) => {
          const tpl = item.print_template;
          const categories = item.item_categories
            .map((ic) => ic.category)
            .filter((c): c is NonNullable<typeof c> => !!c);
          const label =
            categories.map((c) => c.name).filter(Boolean).join(" / ") || tpl.label;
          return {
            itemId: item.id,
            label,
            template: tpl,
            mockupUrl: tpl.mockup_path
              ? supabase.storage
                  .from("print-templates")
                  .getPublicUrl(tpl.mockup_path).data.publicUrl
              : null,
            maskUrl: tpl.mask_path
              ? supabase.storage
                  .from("print-templates")
                  .getPublicUrl(tpl.mask_path).data.publicUrl
              : null,
            categories,
          };
        })
    : [];

  return (
    <article className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Productos", href: "/" },
          { label: product.title },
        ]}
      />
      <ProductCard product={product} items={itemList} customizableEnabled={customizableFlag} />

      {isPurchasable && isCustomizable && (
        <section className="rounded-2xl border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[6px_6px_0_0_var(--shadow)]">
          <h2 className="font-display text-xl font-bold">Diseña tu producto</h2>
          <Suspense fallback={null}>
            <CustomizationFlow
              productId={product.id}
              productTitle={product.title}
              productImage={product.images?.[0]?.url}
              price={payablePrice}
              amountInCents={amountInCents}
              kind={product.customization_kind!}
              variants={customizationVariants}
            />
          </Suspense>
        </section>
      )}
    </article>
  );
}
