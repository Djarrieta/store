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
import Input from "@/app/components/Input";
import { useCart } from "@/lib/cart";
import { getSource, putSource } from "@/lib/customizations/indexedDb";
import {
  deleteLocalCustomization,
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

const KIND_PICKER_LABEL: Record<CustomizationKind, string> = {
  phone_case: "Elige tu teléfono",
  tshirt: "Elige tu talla",
  mug: "Elige el mug",
};

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

  const { addItem, openCart } = useCart();
  const editorRef = useRef<CustomizationEditorHandle | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [variantId, setVariantId] = useState<string>("");
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
        kind,
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

  function handleStartOver() {
    if (source?.url.startsWith("blob:")) URL.revokeObjectURL(source.url);
    if (activeLocalKey) {
      deleteLocalCustomization(activeLocalKey);
    }
    setSource(null);
    setVariantId("");
    setTransform(DEFAULT_TRANSFORM);
    setActiveLocalKey(null);
    setStep(1);
    setConfirmMsg(null);
    setEditError(null);
  }

  if (variants.length === 0) {
    return (
      <p className="mt-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
        Aún no hay variaciones disponibles para personalizar.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <StepIndicator current={step} />

      {editError && (
        <p className="rounded-lg border-2 border-[var(--error-text)] bg-[var(--error-bg,#fee2e2)] px-3 py-2 text-sm text-[var(--error-text)]">
          {editError}
        </p>
      )}

      {step === 1 && (
        <VariantPicker
          kind={kind}
          variants={variants}
          selectedId={variantId}
          onPick={(id) => {
            setVariantId(id);
            setStep(2);
          }}
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
          />
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="secondary" onClick={handleStartOver}>
              Empezar de nuevo
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
            <p className="rounded-lg border-2 border-[var(--ok-border)] bg-[var(--ok-bg)] px-3 py-2 text-sm font-semibold text-[var(--ok-text)]">
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
    <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      {([1, 2, 3, 4] as Step[]).map((n) => (
        <li
          key={n}
          className={`rounded-full border-2 px-3 py-1 ${
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

function VariantPicker({
  kind,
  variants,
  selectedId,
  onPick,
}: {
  kind: CustomizationKind;
  variants: EditorVariant[];
  selectedId: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold">{KIND_PICKER_LABEL[kind]}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {variants.map((v) => (
          <button
            key={v.itemId}
            type="button"
            onClick={() => onPick(v.itemId)}
            className={`rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold shadow-[2px_2px_0_0_var(--shadow)] transition-transform hover:-translate-y-0.5 ${
              selectedId === v.itemId
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            {v.label}
          </button>
        ))}
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
      <Input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={async (e) => {
          const input = e.currentTarget;
          const file = input.files?.[0] ?? null;
          await handleFile(file);
          input.value = "";
        }}
      />
      <Button variant="secondary" onClick={onBack}>
        Cambiar variación
      </Button>
    </div>
  );
}
