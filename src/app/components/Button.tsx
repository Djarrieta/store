import { type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
/** Use "none" to skip automatic padding/rounding/font — supply those via className instead */
export type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon" | "none";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Adds the NeoBrutalism offset shadow + hover lift effect */
  shadow?: boolean;
  fullWidth?: boolean;
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

export default function Button({
  variant = "secondary",
  size = "md",
  shadow = false,
  fullWidth = false,
  className,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isGhost = variant === "ghost";
  const hasSize = size !== "none";
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        variantClasses[variant],
        // ghost and size="none" buttons skip automatic sizing — rely on className
        !isGhost && hasSize && sizeClasses[size as Exclude<ButtonSize, "none">],
        !isGhost && hasSize && shadow && shadowClasses[size as Exclude<ButtonSize, "none">],
        fullWidth && "w-full",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
