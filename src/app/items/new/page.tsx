import { requireAdmin } from "@/lib/auth";
import ItemForm from "../ItemForm";
import { createItem } from "../actions";

export default async function NewItemPage() {
  await requireAdmin();

  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Create Item</h1>
      <ItemForm action={createItem} />
    </section>
  );
}
