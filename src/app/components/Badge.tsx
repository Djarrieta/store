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
  primary: "bg-[var(--accent)] border border-[var(--accent)] text-[var(--accent-foreground)]",
  secondary: "bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)]",
  danger: "bg-[var(--danger)] border border-[var(--danger)] text-[var(--fg)]",
  success: "bg-[var(--success)] border border-[var(--success)] text-[var(--fg)]",
  warning: "bg-[var(--warning)] border border-[var(--warning)] text-[var(--fg)]",
  muted: "bg-[var(--card)] border border-[var(--border)] text-[var(--muted)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs rounded-[var(--radius-btn-sm)] font-medium tracking-wide",
  md: "px-2.5 py-1 text-xs rounded-[var(--radius-btn-md)] font-medium tracking-wide",
  lg: "px-3 py-1.5 text-sm rounded-[var(--radius-btn-md)] font-medium tracking-wide",
};

const shadowClasses: Record<BadgeSize, string> = {
  sm: "shadow-[var(--shadow-soft-sm)]",
  md: "shadow-[var(--shadow-soft-sm)]",
  lg: "shadow-[var(--shadow-soft)]",
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
