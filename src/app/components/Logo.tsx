import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  /** Wrap the logo in a link to this href. Pass `null` to render without a link. */
  href?: string | null;
  /** Rendered pixel height of the logo image. */
  height?: number;
  /** Render the Playfair "CRISTA" wordmark instead of the image lockup. */
  wordmark?: boolean;
  className?: string;
  priority?: boolean;
}

export default function Logo({
  href = "/",
  height = 56,
  wordmark = false,
  className,
  priority = false,
}: LogoProps) {
  const content = wordmark ? (
    <span
      className={clsx(
        "font-display text-2xl uppercase tracking-[0.28em] text-[var(--accent)]",
        className,
      )}
    >
      Crista
    </span>
  ) : (
    <Image
      src="/logo.jpeg"
      alt="CRISTA — Naturalmente tú"
      width={Math.round(height * 1.6)}
      height={height}
      priority={priority}
      className={clsx("h-auto w-auto object-contain", className)}
      style={{ height }}
    />
  );

  if (href === null) return content;

  return (
    <Link href={href} aria-label="CRISTA — inicio" className="inline-flex items-center">
      {content}
    </Link>
  );
}
