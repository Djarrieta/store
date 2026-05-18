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
  primary: "bg-[var(--accent)] border-2 border-[var(--border)] text-[var(--accent-foreground)]",
  secondary: "bg-[var(--surface)] border-2 border-[var(--border)] hover:bg-[var(--bg)]",
  ghost: "text-[var(--muted)] underline hover:text-[var(--fg)]",
  danger: "bg-[var(--danger)] border-2 border-[var(--border)]",
  success: "bg-[var(--success)] border-2 border-[var(--border)]",
};

const sizeClasses: Record<Exclude<ButtonSize, "none">, string> = {
  sm: "px-2 py-1 text-xs rounded-md font-semibold",
  md: "px-3 py-2 text-sm rounded-md font-semibold",
  lg: "px-4 py-2 text-sm rounded-lg font-bold",
  xl: "px-6 py-3 rounded-xl font-bold",
  icon: "h-6 w-6 flex items-center justify-center rounded font-bold text-sm",
};

const shadowClasses: Record<Exclude<ButtonSize, "none">, string> = {
  sm: "shadow-[2px_2px_0_0_var(--shadow)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
  md: "shadow-[2px_2px_0_0_var(--shadow)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
  lg: "shadow-[3px_3px_0_0_var(--shadow)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all",
  xl: "shadow-[4px_4px_0_0_var(--shadow)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
  icon: "shadow-[2px_2px_0_0_var(--shadow)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
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
      <Link className={classes} {...omitShared(props as AsLink)}>
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
