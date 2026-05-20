import clsx from "clsx";

export type BadgeVariant = "primary" | "secondary" | "danger" | "success" | "warning" | "muted";
export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Adds the NeoBrutalism offset shadow */
  shadow?: boolean;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-[var(--accent)] border-2 border-[var(--border)] text-[var(--accent-foreground)]",
  secondary: "bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--fg)]",
  danger: "bg-[var(--danger)] border-2 border-[var(--border)] text-black",
  success: "bg-[var(--success)] border-2 border-[var(--border)] text-black",
  warning: "bg-[var(--warning)] border-2 border-[var(--border)] text-black",
  muted: "bg-[var(--bg)] border-2 border-[var(--border)] text-[var(--muted)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs rounded font-semibold",
  md: "px-2 py-1 text-xs rounded-md font-semibold",
  lg: "px-3 py-1.5 text-sm rounded-md font-bold",
};

const shadowClasses: Record<BadgeSize, string> = {
  sm: "shadow-[2px_2px_0_0_var(--shadow)]",
  md: "shadow-[2px_2px_0_0_var(--shadow)]",
  lg: "shadow-[3px_3px_0_0_var(--shadow)]",
};

export default function Badge({
  variant = "secondary",
  size = "md",
  shadow = false,
  className,
  children,
}: BadgeProps) {
  const classes = clsx(
    "inline-flex items-center",
    variantClasses[variant],
    sizeClasses[size],
    shadow && shadowClasses[size],
    className,
  );

  return <span className={classes}>{children}</span>;
}
