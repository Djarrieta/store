import { createProduct } from "../actions";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo producto</h1>
      <p className="text-sm text-[var(--muted)]">Después de guardar podrás agregar variantes e inventario.</p>
      <ProductForm action={createProduct} />
    </section>
  );
}
