import Button from "@/app/components/Button";

interface PageHeaderProps {
  title: string;
  createHref?: string;
  createLabel?: string;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}

export default function PageHeader({
  title,
  createHref,
  createLabel,
  isEmpty,
  emptyText,
  children,
}: PageHeaderProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border-4 border-black bg-[var(--card)] p-5 shadow-[6px_6px_0_0_#111]">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {createHref && createLabel ? (
          <Button href={createHref} variant="primary" size="lg" shadow>
            {createLabel}
          </Button>
        ) : null}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border-2 border-black bg-white p-4 text-sm">{emptyText ?? "Sin datos."}</div>
      ) : (
        children
      )}
    </section>
  );
}
