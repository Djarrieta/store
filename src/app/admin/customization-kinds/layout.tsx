import { notFound } from "next/navigation";

import { isFeatureEnabled } from "@/lib/flags";

export default async function CustomizationKindsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enabled = await isFeatureEnabled("customizable_products");
  if (!enabled) notFound();
  return <>{children}</>;
}
