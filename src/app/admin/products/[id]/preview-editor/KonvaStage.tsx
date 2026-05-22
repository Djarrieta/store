"use client";

import { useEffect, useRef, useState } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";

import type { EditorVariant, SourceImage, Transform } from "./PreviewEditor";

interface Props {
  variant: EditorVariant;
  source: SourceImage | null;
  transform: Transform;
  onTransformChange: (next: Transform) => void;
}

const MAX_STAGE = 560;

function fitStage(widthMm: number, heightMm: number) {
  const aspect = widthMm / heightMm;
  if (aspect >= 1) {
    return { width: MAX_STAGE, height: Math.round(MAX_STAGE / aspect) };
  }
  return { width: Math.round(MAX_STAGE * aspect), height: MAX_STAGE };
}

function useHtmlImage(url: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ url: string; img: HTMLImageElement } | null>(
    null,
  );
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    const el = new window.Image();
    // CORS is only needed for cross-origin URLs (mockup served from Supabase).
    // Setting it on blob: / data: URLs can silently break the load in some browsers.
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

export default function KonvaStage({
  variant,
  source,
  transform,
  onTransformChange,
}: Props) {
  const { template, mockupUrl } = variant;
  const stage = fitStage(template.width_mm, template.height_mm);
  const mockup = useHtmlImage(mockupUrl);
  const userImg = useHtmlImage(source?.url ?? null);
  const imgRef = useRef<unknown>(null);

  const drawnW = source ? transform.scale * stage.width : 0;
  const drawnH = source ? (source.height / source.width) * drawnW : 0;

  const effectiveDpi = computeEffectiveDpi(source, transform, template);
  const dpiTone =
    effectiveDpi === null
      ? "muted"
      : effectiveDpi < 72
        ? "danger"
        : effectiveDpi < 150
          ? "warn"
          : "ok";

  const safe = template.safe_area;

  return (
    <div className="space-y-3">
      <div
        className="mx-auto overflow-hidden rounded-xl border-2 border-[var(--border)] bg-[var(--surface)]"
        style={{ width: stage.width, height: stage.height }}
      >
        <Stage width={stage.width} height={stage.height}>
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
            <Group
              clipFunc={(ctx) => drawTshirtClip(ctx, stage.width, stage.height)}
            >
              {userImg && source && (
                <KonvaImage
                  ref={imgRef as never}
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
            </Group>
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
                0,
                0,
                stage.width,
                0,
                stage.width,
                stage.height,
                0,
                stage.height,
                0,
                0,
              ]}
              stroke="var(--border)"
              strokeWidth={2}
            />
          </Layer>
        </Stage>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Pill tone="muted">
          Lienzo {stage.width} × {stage.height} px
        </Pill>
        {effectiveDpi !== null && (
          <Pill tone={dpiTone}>DPI efectivo: {effectiveDpi.toFixed(0)}</Pill>
        )}
        {!source && (
          <Pill tone="muted">Sube una imagen para empezar</Pill>
        )}
        {safe && <Pill tone="muted">Área segura visible</Pill>}
      </div>
    </div>
  );
}

// T-shirt silhouette derived from supabase/seed/images/tshirt-blank.svg (viewBox 600x800).
// Used as Konva clipFunc so the uploaded image only renders inside the shirt body.
function drawTshirtClip(
  ctx: CanvasRenderingContext2D,
  stageW: number,
  stageH: number,
) {
  const sx = stageW / 600;
  const sy = stageH / 800;
  const X = (n: number) => n * sx;
  const Y = (n: number) => n * sy;
  ctx.beginPath();
  ctx.moveTo(X(180), Y(120));
  ctx.lineTo(X(110), Y(170));
  ctx.lineTo(X(70), Y(280));
  ctx.lineTo(X(150), Y(330));
  ctx.lineTo(X(170), Y(270));
  ctx.lineTo(X(170), Y(720));
  ctx.lineTo(X(430), Y(720));
  ctx.lineTo(X(430), Y(270));
  ctx.lineTo(X(450), Y(330));
  ctx.lineTo(X(530), Y(280));
  ctx.lineTo(X(490), Y(170));
  ctx.lineTo(X(420), Y(120));
  ctx.bezierCurveTo(X(400), Y(170), X(360), Y(195), X(300), Y(195));
  ctx.bezierCurveTo(X(240), Y(195), X(200), Y(170), X(180), Y(120));
  ctx.closePath();
}

function computeEffectiveDpi(
  source: SourceImage | null,
  transform: Transform,
  template: { width_mm: number; print_dpi: number },
): number | null {
  if (!source) return null;
  const printableWidthPx = (template.width_mm / 25.4) * template.print_dpi;
  const drawnWidthPx = transform.scale * printableWidthPx;
  if (drawnWidthPx <= 0) return null;
  return (source.width / drawnWidthPx) * template.print_dpi;
}

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
      className={`rounded-full border-2 bg-[var(--card)] px-2 py-0.5 font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}
