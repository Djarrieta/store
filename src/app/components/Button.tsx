"use client";

import clsx from "clsx";
import Link from "next/link";
import { type AnchorHTMLAttributes, type ButtonHTMLAttributes,useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
/** Use "none" to skip automatic padding/rounding/font — supply those via className instead */
export type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon" | "none";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Adds the NeoBrutalism offset shadow + hover lift effect */
  shadow?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type AsButton = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & {
    href?: never;
    /**
     * When set, the first click shows a confirmation label (default "¿Seguro?").
     * The action only fires on the second click. Reverts automatically after 3 s.
     * Pass a string to customise the confirmation label.
     */
    confirm?: boolean | string;
    /** Show a loading spinner and disable the button. For submit buttons this is
     *  also triggered automatically while the parent form's server action is pending. */
    loading?: boolean;
  };

type AsLink = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps> & {
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

const SHARED_KEYS = new Set<string>(["variant", "size", "shadow", "fullWidth", "className", "children"]);

function omitShared<T extends ButtonProps>(props: T): Omit<T, keyof SharedProps> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (!SHARED_KEYS.has(key)) result[key] = value;
  }
  return result as Omit<T, keyof SharedProps>;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] border border-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]",
  secondary: "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
  ghost: "text-[var(--muted)] underline underline-offset-4 hover:text-[var(--accent)]",
  danger: "bg-[var(--danger)] border border-[var(--danger)] text-[var(--fg)] hover:brightness-95",
  success: "bg-[var(--success)] border border-[var(--success)] text-[var(--fg)] hover:brightness-95",
};

const sizeClasses: Record<Exclude<ButtonSize, "none">, string> = {
  sm: "px-3 py-1 text-xs rounded-[var(--radius-btn-sm)] font-medium tracking-wide",
  md: "px-4 py-2 text-sm rounded-[var(--radius-btn-md)] font-medium tracking-wide",
  lg: "px-5 py-2.5 text-sm rounded-[var(--radius-btn-lg)] font-medium uppercase tracking-[0.12em]",
  xl: "px-7 py-3 rounded-[var(--radius-btn-xl)] font-medium uppercase tracking-[0.16em]",
  icon: "h-7 w-7 flex items-center justify-center rounded-[var(--radius-btn-icon)] font-medium text-sm",
};

const shadowClasses: Record<Exclude<ButtonSize, "none">, string> = {
  sm: "shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-soft)] transition-all",
  md: "shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-soft)] transition-all",
  lg: "shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-soft-lg)] transition-all",
  xl: "shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-soft-lg)] transition-all",
  icon: "shadow-[var(--shadow-soft-sm)] hover:shadow-[var(--shadow-soft)] transition-all",
};

export default function Button(props: ButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pending } = useFormStatus();

  const variant = props.variant ?? "secondary";
  const size = props.size ?? "md";
  const shadow = props.shadow ?? false;
  const fullWidth = props.fullWidth ?? false;
  const { className, children } = props;

  const isGhost = variant === "ghost";
  const hasSize = size !== "none";
  const classes = clsx(
    variantClasses[variant],
    !isGhost && hasSize && sizeClasses[size as Exclude<ButtonSize, "none">],
    !isGhost && hasSize && shadow && shadowClasses[size as Exclude<ButtonSize, "none">],
    fullWidth && "w-full",
    className,
  );

  if ("href" in props) {
    return (
      <Link
        className={clsx("inline-flex items-center justify-center text-center", classes)}
        {...omitShared(props as AsLink)}
      >
        {children}
      </Link>
    );
  }

  const { disabled, type = "button", ...buttonRest } = omitShared(props as AsButton) as ButtonHTMLAttributes<HTMLButtonElement>;
  const { confirm: confirmProp, loading: loadingProp, onClick, ...safeButtonRest } = buttonRest as AsButton;
  const confirmLabel = typeof confirmProp === "string" ? confirmProp : "¿Seguro?";
  const isLoading = loadingProp || (type === "submit" && pending);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!confirmProp) {
      onClick?.(e);
      return;
    }
    if (!confirming) {
      e.preventDefault();
      setConfirming(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setConfirming(false);
    onClick?.(e);
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={clsx(classes, (disabled || isLoading) && "opacity-40 pointer-events-none")}
      onClick={handleClick}
      {...safeButtonRest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-1.5">
          <span
            className="animate-spin h-3 w-3 shrink-0 rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {children}
        </span>
      ) : confirming ? confirmLabel : children}
    </button>
  );
}
