import { redirect } from "next/navigation";

export default function NewItemPage() {
  redirect("/admin/items/new");
}
