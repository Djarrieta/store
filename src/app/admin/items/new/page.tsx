import ItemForm from "@/app/items/ItemForm";
import { createItem } from "@/app/items/actions";

export default function NewAdminItemPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Create Item</h1>
      <ItemForm action={createItem} />
    </section>
  );
}
