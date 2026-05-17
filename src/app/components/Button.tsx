import Link from "next/link";
import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import clsx from "clsx";

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
  primary: "bg-[var(--accent)] border-2 border-black",
  secondary: "bg-white border-2 border-black hover:bg-[var(--bg)]",
  ghost: "text-[var(--muted)] underline hover:text-[var(--fg)]",
  danger: "bg-red-300 border-2 border-black",
  success: "bg-green-300 border-2 border-black",
};

const sizeClasses: Record<Exclude<ButtonSize, "none">, string> = {
  sm: "px-2 py-1 text-xs rounded-md font-semibold",
  md: "px-3 py-2 text-sm rounded-md font-semibold",
  lg: "px-4 py-2 text-sm rounded-lg font-bold",
  xl: "px-6 py-3 rounded-xl font-bold",
  icon: "h-6 w-6 flex items-center justify-center rounded font-bold text-sm",
};

const shadowClasses: Record<Exclude<ButtonSize, "none">, string> = {
  sm: "shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
  md: "shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
  lg: "shadow-[3px_3px_0_0_#111] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all",
  xl: "shadow-[4px_4px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
  icon: "shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
};

export default function Button(props: ButtonProps) {
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
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(classes, disabled && "opacity-40 pointer-events-none")}
      {...buttonRest}
    >
      {children}
    </button>
  );
}
