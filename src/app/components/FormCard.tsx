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
        "min-w-0 space-y-5 rounded-xl border-2 border-black bg-white",
        "p-4 shadow-[3px_3px_0_0_#111] sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────
// Renders a labelled field slot. Pass the input/select/textarea as children.
type FormFieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, children, className }: FormFieldProps) {
  return (
    <div className={clsx("grid gap-1", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
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
