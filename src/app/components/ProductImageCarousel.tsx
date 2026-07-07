"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@/app/components/Button";
import type { ProductImage } from "@/types/product";

interface ProductImageCarouselProps {
  images: ProductImage[];
  title: string;
  compact?: boolean;
}

export default function ProductImageCarousel({
  images,
  title,
  compact = false,
}: ProductImageCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(images.length > 1);
  const [current, setCurrent] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 1);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 1);
    const idx = clientWidth > 0 ? Math.round(scrollLeft / clientWidth) : 0;
    setCurrent(Math.min(Math.max(idx, 0), images.length - 1));
  }, [images.length]);

  useEffect(() => {
    updateScrollState();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const scrollPrev = () => scrollToIndex(Math.max(current - 1, 0));
  const scrollNext = () => scrollToIndex(Math.min(current + 1, images.length - 1));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollNext();
    }
  };

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative mx-auto mb-5 aspect-[4/3] w-full max-w-[min(100%,80vh)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg)]">
        <Image
          src={images[0].url}
          alt={images[0].description ?? title}
          fill
          unoptimized
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </div>
    );
  }

  const arrowBtnClass =
    "absolute top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full p-0 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-soft-lg)]";
  const arrowIconProps = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  return (
    <div
      className="mb-5 select-none"
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDownCapture={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative mx-auto w-full max-w-[min(100%,80vh)]">
        {/* Scroll-snap track (swipeable) */}
        <div
          ref={scrollerRef}
          className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${images.length}`}
              className="relative h-full min-w-0 shrink-0 grow-0 basis-full snap-start"
            >
              <Image
                src={img.url}
                alt={img.description ?? `${title} — imagen ${i + 1}`}
                fill
                unoptimized
                priority={i === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {/* Prev / Next arrows — project Button (icon variant + shadow) */}
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Imagen anterior"
          className={`${arrowBtnClass} left-2`}
        >
          <svg {...arrowIconProps}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Imagen siguiente"
          className={`${arrowBtnClass} right-2`}
        >
          <svg {...arrowIconProps}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Slide counter */}
      {!compact && (
        <p className="mt-2 text-center text-xs font-medium text-[var(--muted)]">
          {current + 1} / {images.length}
        </p>
      )}

      {/* Thumbnail strip */}
      {!compact && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <Button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={img.description ?? `Imagen ${i + 1}`}
              aria-current={i === current}
              className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[var(--radius-btn-md)] border transition-all ${
                i === current
                  ? "border-[var(--accent)] shadow-[var(--shadow-soft-sm)]"
                  : "border-[var(--border)]/40 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.description ?? `Miniatura ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
