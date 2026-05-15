import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/types";
import ItemForm from "@/app/items/ItemForm";
import { updateItem } from "@/app/items/actions";

export default async function AdminEditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single<Item>();

  if (!item) notFound();

  const updateWithId = updateItem.bind(null, id);

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Edit Item</h1>
      <ItemForm action={updateWithId} defaultValues={item} />
    </section>
  );
}
