import { requireAdmin } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/flags";

import AdminNav from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const customizableEnabled = await isFeatureEnabled("customizable_products");
  const hiddenLinks = customizableEnabled ? [] : ["/admin/customization-kinds"];
  return (
    <div className="space-y-6">
      <AdminNav hiddenLinks={hiddenLinks} />
      {children}
    </div>
  );
}

