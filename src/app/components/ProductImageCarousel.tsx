"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";
import Button from "@/app/components/Button";

interface ProductImageCarouselProps {
  images: ProductImage[];
  title: string;
}

export default function ProductImageCarousel({
  images,
  title,
}: ProductImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Image
        src={images[0].url}
        alt={images[0].description ?? title}
        width={1200}
        height={600}
        unoptimized
        priority
        className="mb-5 h-64 w-full rounded-xl border-2 border-black object-cover"
      />
    );
  }

  return (
    <div className="mb-5 select-none">
      {/* Main image */}
      <div className="relative h-64 w-full overflow-hidden rounded-xl border-2 border-black">
        <Image
          src={images[current].url}
          alt={images[current].description ?? `${title} — imagen ${current + 1}`}
          fill
          unoptimized
          priority={current === 0}
          className="object-cover"
        />

        {/* Prev / Next arrows */}
        <Button
          variant="secondary"
          size="lg"
          shadow
          onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
          aria-label="Imagen anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1"
        >
          ‹
        </Button>
        <Button
          variant="secondary"
          size="lg"
          shadow
          onClick={() => setCurrent((c) => (c + 1) % images.length)}
          aria-label="Imagen siguiente"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1"
        >
          ›
        </Button>
      </div>

      {/* Dot indicators */}
      <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Seleccionar imagen">
        {images.map((img, i) => (
          <Button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={img.description ?? `Imagen ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-2.5 w-2.5 rounded-full border-2 border-black transition-colors ${
              i === current ? "bg-black" : "bg-white"
            }`}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <Button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={img.description ?? `Imagen ${i + 1}`}
            className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
              i === current
                ? "border-black shadow-[2px_2px_0_0_#111]"
                : "border-gray-300 opacity-60 hover:opacity-100"
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
    </div>
  );
}
