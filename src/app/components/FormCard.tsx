import clsx from "clsx";
import type { FormHTMLAttributes, ReactNode } from "react";

// ── FormCard ──────────────────────────────────────────────────────────────────
// A <form> wrapped in the NeoBrutalism card style with responsive padding.
// Accepts all standard <form> attributes (including server-action functions
// as the `action` prop, which Next.js supports natively).
type FormCardProps = FormHTMLAttributes<HTMLFormElement> & {
  children: ReactNode;
};

export function FormCard({ children, className, ...props }: FormCardProps) {
  return (
    <form
      className={clsx(
        "min-w-0 space-y-5 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]",
        "p-4 shadow-[var(--shadow-soft)] sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

// ── FormActions ───────────────────────────────────────────────────────────────
// A wrapping row for form action buttons. Wraps to a new line on small screens.
type FormActionsProps = {
  children: ReactNode;
  className?: string;
};

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={clsx("flex flex-wrap gap-3 pt-1", className)}>
      {children}
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
// A plain <form> wrapper for inline/utility forms (no card styles).
export function Form({ children, ...props }: FormCardProps) {
  return <form {...props}>{children}</form>;
}
