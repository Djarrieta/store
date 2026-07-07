"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Button from "@/app/components/Button";
import CustomizationEditor, {
  type CustomizationEditorHandle,
} from "@/app/components/customization/CustomizationEditor";
import {
  DEFAULT_TRANSFORM,
  type EditorVariant,
  type SourceImage,
  type Transform,
} from "@/app/components/customization/types";
import { Select } from "@/app/components/Input";
import { useCart } from "@/lib/cart";
import { getSource, putSource } from "@/lib/customizations/indexedDb";
import {
  getLocalCustomization,
  newLocalKey,
  putLocalCustomization,
} from "@/lib/customizations/localStore";
import type { CustomizationKind } from "@/types";

interface Props {
  productId: string;
  productTitle: string;
  productImage?: string;
  price: number;
  amountInCents: number;
  kind: CustomizationKind;
  variants: EditorVariant[];
}

type Step = 1 | 2 | 3 | 4;

export default function CustomizationFlow({
  productId,
  productTitle,
  productImage,
  price,
  amountInCents,
  kind,
  variants,
}: Props) {
  const params = useSearchParams();
  const editParam = params.get("edit");
  const editLocalKey = editParam?.startsWith("local:")
    ? editParam.slice("local:".length)
    : null;
  const preselectVariantId = params.get("variant");

  const { addItem, openCart } = useCart();
  const editorRef = useRef<CustomizationEditorHandle | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [variantId, setVariantId] = useState<string>(() =>
    !editLocalKey &&
    preselectVariantId &&
    variants.some((v) => v.itemId === preselectVariantId)
      ? preselectVariantId
      : "",
  );
  const [source, setSource] = useState<SourceImage | null>(null);
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  // The localKey we'll commit under. New keys are minted only on confirm,
  // so abandoning the editor doesn't leak IDB blobs.
  const [activeLocalKey, setActiveLocalKey] = useState<string | null>(null);

  const variant = useMemo(
    () => variants.find((v) => v.itemId === variantId),
    [variants, variantId],
  );

  // Hydrate from IndexedDB if we landed here via ?edit=local:<id>
  useEffect(() => {
    if (!editLocalKey) return;
    let cancelled = false;
    (async () => {
      const record = getLocalCustomization(editLocalKey);
      const blob = await getSource(editLocalKey).catch(() => null);
      if (cancelled || !record || !blob) {
        setEditError(
          "No se encontró la personalización para editar. Empieza una nueva.",
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      setVariantId(record.itemId);
      setTransform(record.transform);
      setSource({
        url,
        width: record.sourceWidth,
        height: record.sourceHeight,
        blob,
      });
      setActiveLocalKey(editLocalKey);
      setStep(3);
    })();
    return () => {
      cancelled = true;
    };
  }, [editLocalKey]);

  async function handleConfirm() {
    if (!variant || !source || busy) return;
    setBusy(true);
    try {
      // Capture preview from the Konva stage.
      const dataUrl = editorRef.current?.toDataUrl(1.5);
      if (!dataUrl) throw new Error("No se pudo generar la vista previa.");

      const localKey = activeLocalKey ?? newLocalKey();

      // Persist source blob + metadata locally.
      if (source.blob) {
        await putSource(localKey, source.blob);
      }
      putLocalCustomization({
        localKey,
        itemId: variant.itemId,
        productId,
        kind: { slug: kind.slug, label: kind.label },
        templateLabel: variant.label,
        transform,
        sourceWidth: source.width,
        sourceHeight: source.height,
        previewDataUrl: dataUrl,
        createdAt: Date.now(),
      });

      addItem({
        id: `${variant.itemId}:${localKey}`,
        productId,
        itemId: variant.itemId,
        title: `${productTitle} — ${variant.label}`,
        price,
        amountInCents,
        image: productImage,
        customizationLocalKey: localKey,
        customizationPreviewDataUrl: dataUrl,
      });
      setActiveLocalKey(localKey);
      setConfirmMsg("Añadido al carrito");
      openCart();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  if (variants.length === 0) {
    return (
      <p className="mt-4 rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
        Aún no hay variaciones disponibles para personalizar.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <StepIndicator current={step} />

      {editError && (
        <p className="rounded-[var(--radius-btn-md)] border border-[var(--error-text)] bg-[var(--error-bg,#fee2e2)] px-3 py-2 text-sm text-[var(--error-text)]">
          {editError}
        </p>
      )}

      {step === 1 && (
        <VariantPicker
          kind={kind}
          variants={variants}
          selectedId={variantId}
          onSelect={setVariantId}
          onContinue={() => setStep(2)}
        />
      )}

      {step === 2 && variant && (
        <UploadStep
          onBack={() => setStep(1)}
          onPicked={(img) => {
            setSource(img);
            setTransform(DEFAULT_TRANSFORM);
            setStep(3);
            setEditError(null);
          }}
          onError={setEditError}
        />
      )}

      {step === 3 && variant && (
        <div className="space-y-3">
          <CustomizationEditor
            ref={editorRef}
            variant={variant}
            source={source}
            transform={transform}
            onTransformChange={setTransform}
            onSourceChange={(next, err) => {
              setSource(next);
              setEditError(err);
            }}
            showFileInput={false}
          />
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Cambiar imagen
            </Button>
            <Button
              variant="primary"
              shadow
              disabled={!source}
              onClick={() => setStep(4)}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {step === 4 && variant && source && (
        <div className="space-y-3">
          <CustomizationEditor
            ref={editorRef}
            variant={variant}
            source={source}
            transform={transform}
            onTransformChange={setTransform}
            onSourceChange={(next, err) => {
              setSource(next);
              setEditError(err);
            }}
            showFileInput={false}
          />
          {confirmMsg ? (
            <p className="rounded-[var(--radius-btn-md)] border border-[var(--ok-border)] bg-[var(--ok-bg)] px-3 py-2 text-sm font-medium text-[var(--ok-text)]">
              {confirmMsg}
            </p>
          ) : (
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Volver a editar
              </Button>
              <Button
                variant="primary"
                size="xl"
                shadow
                disabled={busy}
                onClick={handleConfirm}
              >
                {busy ? "Guardando..." : "Añadir al carrito"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const labels: Record<Step, string> = {
    1: "Variación",
    2: "Imagen",
    3: "Editar",
    4: "Confirmar",
  };
  return (
    <ol className="flex flex-wrap items-center gap-2 text-xs font-medium">
      {([1, 2, 3, 4] as Step[]).map((n) => (
        <li
          key={n}
          className={`rounded-full border px-3 py-1 ${
            n === current
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
              : n < current
                ? "border-[var(--border)] bg-[var(--card)] text-[var(--fg)]"
                : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
          }`}
        >
          {n}. {labels[n]}
        </li>
      ))}
    </ol>
  );
}

interface Dimension {
  id: string;
  name: string;
  values: { id: string; name: string }[];
}

function deriveDimensions(variants: EditorVariant[]): Dimension[] {
  const map = new Map<string, Dimension>();
  for (const v of variants) {
    for (const cat of v.categories) {
      if (!cat.parent_id || !cat.parent) continue;
      if (!map.has(cat.parent_id)) {
        map.set(cat.parent_id, { id: cat.parent_id, name: cat.parent.name, values: [] });
      }
      const dim = map.get(cat.parent_id)!;
      if (!dim.values.find((vv) => vv.id === cat.id)) {
        dim.values.push({ id: cat.id, name: cat.name });
      }
    }
  }
  return Array.from(map.values());
}

function VariantPicker({
  kind,
  variants,
  selectedId,
  onSelect,
  onContinue,
}: {
  kind: CustomizationKind;
  variants: EditorVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
}) {
  const dimensions = useMemo(() => deriveDimensions(variants), [variants]);
  const selectedVariant = variants.find((v) => v.itemId === selectedId);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const acc: Record<string, string> = {};
    if (selectedVariant) {
      for (const cat of selectedVariant.categories) {
        if (cat.parent_id) acc[cat.parent_id] = cat.id;
      }
    }
    return acc;
  });

  function handleChange(dimId: string, valueId: string) {
    const next = { ...selected, [dimId]: valueId };
    setSelected(next);
    const valueIds = Object.values(next);
    if (valueIds.length === dimensions.length && dimensions.length > 0) {
      const match = variants.find((v) =>
        valueIds.every((vid) => v.categories.some((c) => c.id === vid)),
      );
      if (match) onSelect(match.itemId);
      else onSelect("");
    } else {
      onSelect("");
    }
  }

  // Fallback: if there are no dimensions (single-variant customizable), auto-select.
  useEffect(() => {
    if (dimensions.length === 0 && variants.length === 1 && !selectedId) {
      onSelect(variants[0].itemId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.length, variants.length]);

  const allSelected =
    dimensions.length > 0 && Object.values(selected).length === dimensions.length;
  const ready = !!selectedId && (dimensions.length === 0 || allSelected);

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold">{kind.picker_label}</h2>
      {dimensions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Variación única disponible.</p>
      ) : (
        dimensions.map((dim) => (
          <label key={dim.id} className="grid gap-1">
            <span className="text-sm font-semibold">{dim.name}</span>
            <Select
              shadow
              value={selected[dim.id] ?? ""}
              onChange={(e) => handleChange(dim.id, e.target.value)}
            >
              <option value="">— Selecciona —</option>
              {dim.values.map((val) => (
                <option key={val.id} value={val.id}>
                  {val.name}
                </option>
              ))}
            </Select>
          </label>
        ))
      )}
      {allSelected && !selectedId && (
        <p className="text-xs font-semibold text-[var(--error-text)]">
          Esa combinación no está disponible.
        </p>
      )}
      <div className="flex justify-end">
        <Button variant="primary" shadow disabled={!ready} onClick={onContinue}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

const MIN_DIM = 500;
const MAX_BYTES = 20 * 1024 * 1024;

function UploadStep({
  onBack,
  onPicked,
  onError,
}: {
  onBack: () => void;
  onPicked: (img: SourceImage) => void;
  onError: (msg: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError(`Formato no soportado (${file.type || "desconocido"}).`);
      return;
    }
    if (file.size > MAX_BYTES) {
      onError(`La imagen pesa más de 20 MB.`);
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close?.();
      if (width < MIN_DIM || height < MIN_DIM) {
        onError(
          `Resolución insuficiente: mínimo ${MIN_DIM}×${MIN_DIM} px (subiste ${width}×${height}).`,
        );
        return;
      }
      const url = URL.createObjectURL(file);
      onPicked({ url, width, height, blob: file });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "error desconocido";
      onError(`No se pudo leer la imagen (${reason}).`);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold">Sube tu imagen</h2>
      <p className="text-sm text-[var(--muted)]">
        Mínimo {MIN_DIM}×{MIN_DIM} px, máximo 20 MB. PNG / JPG / WEBP.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0] ?? null;
          setFileName(file?.name ?? null);
          await handleFile(file);
          input.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-btn-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
        <Button
          variant="primary"
          size="sm"
          shadow
          onClick={() => fileInputRef.current?.click()}
        >
          Elegir archivo
        </Button>
        <span className="text-sm text-[var(--muted)] truncate">
          {fileName ?? "Ningún archivo seleccionado"}
        </span>
      </div>
      <Button variant="secondary" onClick={onBack}>
        Cambiar variación
      </Button>
    </div>
  );
}
