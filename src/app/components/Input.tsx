import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";

// ── Shared base ───────────────────────────────────────────────────────────────
const BASE =
  "rounded-md border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 placeholder:text-[var(--muted)]";
const SHADOW =
  "shadow-[2px_2px_0_0_#111] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all";

// ── Field label wrapper ───────────────────────────────────────────────────────
function FieldWrap({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  shadow?: boolean;
  fullWidth?: boolean;
  label?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ shadow = false, fullWidth = true, label, className, ...props }, ref) {
    const el = (
      <input
        ref={ref}
        className={clsx(BASE, fullWidth && "w-full", shadow && SHADOW, className)}
        {...props}
      />
    );
    return label ? <FieldWrap label={label}>{el}</FieldWrap> : el;
  },
);

export default Input;

// ── Textarea ──────────────────────────────────────────────────────────────────
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  shadow?: boolean;
  fullWidth?: boolean;
  label?: ReactNode;
};

export function Textarea({ shadow = false, fullWidth = true, label, className, ...props }: TextareaProps) {
  const el = (
    <textarea
      className={clsx(BASE, "resize-y", fullWidth && "w-full", shadow && SHADOW, className)}
      {...props}
    />
  );
  return label ? <FieldWrap label={label}>{el}</FieldWrap> : el;
}

// ── Select ────────────────────────────────────────────────────────────────────
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  shadow?: boolean;
  fullWidth?: boolean;
  label?: ReactNode;
  children: React.ReactNode;
};

export function Select({ shadow = false, fullWidth = true, label, className, children, ...props }: SelectProps) {
  const el = (
    <select
      className={clsx(BASE, "bg-white", fullWidth && "w-full", shadow && SHADOW, className)}
      {...props}
    >
      {children}
    </select>
  );
  return label ? <FieldWrap label={label}>{el}</FieldWrap> : el;
}

// ── Checkbox ──────────────────────────────────────────────────────────────────
type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={clsx("h-4 w-4 cursor-pointer rounded border-2 border-black accent-[var(--accent)]", className)}
      {...props}
    />
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
type LabeledFieldProps = {
  label: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function LabeledField({ label, required, className, children }: LabeledFieldProps) {
  return (
    <label className={clsx("grid gap-1", className)}>
      <span className="text-sm font-semibold">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
