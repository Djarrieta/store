"use client";

import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";

import {
  computeEffectiveDpi,
  dpiTone,
  type EditorVariant,
  type SourceImage,
  type Transform,
} from "./types";

const MAX_STAGE = 560;
const MIN_STAGE = 200;

export interface KonvaStageHandle {
  /** Capture the current stage as a PNG data URL (multiplied for crispness). */
  toDataUrl(pixelRatio?: number): string | null;
}

interface Props {
  variant: EditorVariant;
  source: SourceImage | null;
  transform: Transform;
  onTransformChange: (next: Transform) => void;
  /** Called once on mount with a handle to capture the canvas as a PNG. */
  onReady?: (handle: KonvaStageHandle) => void;
  /** Hide the warnings/status pills under the canvas (useful in compact wizards). */
  hideStatus?: boolean;
}

function fitStage(widthMm: number, heightMm: number, maxDim: number) {
  const aspect = widthMm / heightMm;
  if (aspect >= 1) {
    return { width: maxDim, height: Math.round(maxDim / aspect) };
  }
  return { width: Math.round(maxDim * aspect), height: maxDim };
}

function useHtmlImage(url: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ url: string; img: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const el = new window.Image();
    if (!url.startsWith("blob:") && !url.startsWith("data:")) {
      el.crossOrigin = "anonymous";
    }
    el.onload = () => {
      if (!cancelled) setLoaded({ url, img: el });
    };
    el.onerror = () => {
      if (!cancelled) console.error("[KonvaStage] image load failed", url);
    };
    el.src = url;
    return () => {
      cancelled = true;
      el.onload = null;
      el.onerror = null;
    };
  }, [url]);
  return loaded && loaded.url === url ? loaded.img : null;
}

const KonvaStage = function KonvaStage({
  variant,
  source,
  transform,
  onTransformChange,
  onReady,
  hideStatus = false,
}: Props) {
  const { template, mockupUrl, maskUrl } = variant;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [maxDim, setMaxDim] = useState<number>(MAX_STAGE);
  const stage = fitStage(template.width_mm, template.height_mm, maxDim);
  const mockup = useHtmlImage(mockupUrl);
  const mask = useHtmlImage(maskUrl);
  const userImg = useHtmlImage(source?.url ?? null);
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      if (available <= 0) return;
      setMaxDim(Math.max(MIN_STAGE, Math.min(MAX_STAGE, Math.floor(available))));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!onReady) return;
    onReady({
      toDataUrl(pixelRatio = 2) {
        if (!stageRef.current) return null;
        return stageRef.current.toDataURL({ mimeType: "image/png", pixelRatio });
      },
    });
  }, [onReady]);

  const drawnW = source ? transform.scale * stage.width : 0;
  const drawnH = source ? (source.height / source.width) * drawnW : 0;

  const effectiveDpi = computeEffectiveDpi(source, transform, template);
  const tone = dpiTone(effectiveDpi);

  const safe = template.safe_area;

  // Letterbox the mask into the template rect (contain-fit, preserve aspect).
  const maskFit = (() => {
    if (!mask) return null;
    const maskAspect = mask.width / mask.height;
    const stageAspect = stage.width / stage.height;
    if (maskAspect > stageAspect) {
      const w = stage.width;
      const h = w / maskAspect;
      return { x: 0, y: (stage.height - h) / 2, width: w, height: h };
    }
    const h = stage.height;
    const w = h * maskAspect;
    return { x: (stage.width - w) / 2, y: 0, width: w, height: h };
  })();

  return (
    <div className="space-y-3">
      <div ref={wrapperRef} className="w-full">
        <div
          className="mx-auto overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]"
          style={{ width: stage.width, height: stage.height }}
        >
        <Stage ref={stageRef} width={stage.width} height={stage.height}>
          <Layer listening={false}>
            <Rect x={0} y={0} width={stage.width} height={stage.height} fill="#f4f4f4" />
            {mockup && (
              <KonvaImage
                image={mockup}
                x={0}
                y={0}
                width={stage.width}
                height={stage.height}
              />
            )}
          </Layer>

          <Layer>
            {userImg && source && (
              <KonvaImage
                image={userImg}
                x={transform.x * stage.width}
                y={transform.y * stage.height}
                width={drawnW}
                height={drawnH}
                rotation={(transform.rotation * 180) / Math.PI}
                draggable
                onDragEnd={(e) => {
                  onTransformChange({
                    ...transform,
                    x: e.target.x() / stage.width,
                    y: e.target.y() / stage.height,
                  });
                }}
              />
            )}
            {mask && maskFit && (
              <KonvaImage
                image={mask}
                x={maskFit.x}
                y={maskFit.y}
                width={maskFit.width}
                height={maskFit.height}
                listening={false}
                globalCompositeOperation="destination-in"
              />
            )}
          </Layer>

          <Layer listening={false}>
            {safe && (
              <Rect
                x={safe.x * stage.width}
                y={safe.y * stage.height}
                width={safe.width * stage.width}
                height={safe.height * stage.height}
                stroke="#22c55e"
                strokeWidth={2}
                dash={[8, 6]}
              />
            )}
            <Line
              points={[
                0, 0,
                stage.width, 0,
                stage.width, stage.height,
                0, stage.height,
                0, 0,
              ]}
              stroke="var(--border)"
              strokeWidth={2}
            />
          </Layer>
        </Stage>
      </div>
      </div>

      {!hideStatus && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Pill tone="muted">
            Lienzo {stage.width} × {stage.height} px
          </Pill>
          {effectiveDpi !== null && (
            <Pill tone={tone}>DPI efectivo: {effectiveDpi.toFixed(0)}</Pill>
          )}
          {!source && <Pill tone="muted">Sube una imagen para empezar</Pill>}
          {safe && <Pill tone="muted">Área segura visible</Pill>}
        </div>
      )}
    </div>
  );
};

export default KonvaStage;

function Pill({
  tone,
  children,
}: {
  tone: "muted" | "ok" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "border-[var(--success,#16a34a)] text-[var(--success,#16a34a)]"
      : tone === "warn"
        ? "border-amber-500 text-amber-600"
        : tone === "danger"
          ? "border-[var(--error-text)] text-[var(--error-text)]"
          : "border-[var(--border)] text-[var(--muted)]";
  return (
    <span
      className={`rounded-full border bg-[var(--card)] px-2 py-0.5 font-medium ${cls}`}
    >
      {children}
    </span>
  );
}
