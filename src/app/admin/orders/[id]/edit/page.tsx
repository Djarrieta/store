import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import type { Order } from "@/types";
import Breadcrumb from "@/app/components/Breadcrumb";
import OrderEditForm from "./OrderEditForm";

export default async function OrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single<Order>();

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Pedidos", href: "/admin/orders" },
          { label: order.user_name ?? order.user_ref, href: `/admin/orders/${id}` },
          { label: "Editar" },
        ]}
      />
      <div>
        <h1 className="font-display text-2xl font-bold">Editar pedido</h1>
        <p className="text-xs text-[var(--muted)] font-mono mt-1">{order.id}</p>
      </div>
      <OrderEditForm order={order} />
    </div>
  );
}
