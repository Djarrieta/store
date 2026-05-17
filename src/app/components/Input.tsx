import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes,type TextareaHTMLAttributes } from "react";

// ── Shared base ───────────────────────────────────────────────────────────────
const BASE =
  "rounded-md border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50 placeholder:text-[var(--muted)]";
const SHADOW =
  "shadow-[2px_2px_0_0_#111] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all";

// ── Input ─────────────────────────────────────────────────────────────────────
type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  shadow?: boolean;
  fullWidth?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ shadow = false, fullWidth = true, className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(BASE, fullWidth && "w-full", shadow && SHADOW, className)}
        {...props}
      />
    );
  },
);

export default Input;

// ── Textarea ──────────────────────────────────────────────────────────────────
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  shadow?: boolean;
  fullWidth?: boolean;
};

export function Textarea({ shadow = false, fullWidth = true, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={clsx(BASE, "resize-y", fullWidth && "w-full", shadow && SHADOW, className)}
      {...props}
    />
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  shadow?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
};

export function Select({ shadow = false, fullWidth = true, className, children, ...props }: SelectProps) {
  return (
    <select
      className={clsx(BASE, "bg-white", fullWidth && "w-full", shadow && SHADOW, className)}
      {...props}
    >
      {children}
    </select>
  );
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
