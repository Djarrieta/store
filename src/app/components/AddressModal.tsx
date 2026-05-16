"use client";

import { useState, useEffect, useTransition } from "react";
import { getMyAddresses, createAddress } from "@/app/perfil/actions";
import type { Address } from "@/types";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
}

const FIELD_CLASS =
  "w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";
const LABEL_CLASS = "grid gap-1 text-sm font-medium";

export default function AddressModal({ isOpen, onClose, onSelect }: AddressModalProps) {
  const [mode, setMode] = useState<"list" | "form">("list");
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingList, startLoadTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  // Trigger load when modal opens
  useEffect(() => {
    if (!isOpen || addresses !== null) return;
    startLoadTransition(async () => {
      try {
        const list = await getMyAddresses();
        setAddresses(list);
        if (list.length === 0) setMode("form");
      } catch {
        setLoadError("No se pudieron cargar las direcciones.");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleClose() {
    setMode("list");
    setFormError(null);
    setLoadError(null);
    onClose();
  }

  function handleSelect(address: Address) {
    onSelect(address);
    handleClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    startSaveTransition(async () => {
      try {
        const newAddress = await createAddress(formData);
        setAddresses((prev) => (prev ? [newAddress, ...prev] : [newAddress]));
        onSelect(newAddress);
        handleClose();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Error al guardar la dirección");
      }
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dirección de envío"
        className="fixed inset-x-4 top-1/2 z-70 max-h-[85dvh] w-full max-w-md -translate-y-1/2 overflow-y-auto rounded-2xl border-4 border-black bg-[var(--card)] shadow-[8px_8px_0_0_#111] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black p-4">
          <h2 className="font-display text-lg font-bold">
            {mode === "list" ? "Dirección de envío" : "Nueva dirección"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border-2 border-black bg-white px-3 py-1 text-sm font-bold hover:bg-[var(--bg)]"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {mode === "list" && (
            <>
              {isLoadingList && (
                <p className="py-8 text-center text-sm text-[var(--muted)]">
                  Cargando direcciones...
                </p>
              )}

              {loadError && (
                <p className="py-4 text-center text-sm text-red-600">{loadError}</p>
              )}

              {!isLoadingList && !loadError && addresses !== null && (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelect(addr)}
                      className="w-full rounded-xl border-2 border-black bg-white p-4 text-left shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{addr.recipient_name}</p>
                          <p className="mt-0.5 text-sm text-[var(--muted)]">
                            {addr.address_line}
                            {addr.neighborhood ? `, ${addr.neighborhood}` : ""}
                          </p>
                          <p className="text-sm text-[var(--muted)]">
                            {addr.city}, {addr.department}
                          </p>
                          <p className="text-xs text-[var(--muted)]">{addr.phone}</p>
                        </div>
                        {addr.is_default && (
                          <span className="shrink-0 rounded-full border-2 border-black bg-green-200 px-2 py-0.5 text-xs font-bold">
                            Principal
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setMode("form")}
                    className="mt-1 w-full rounded-xl border-2 border-dashed border-black bg-[var(--bg)] py-3 text-sm font-semibold hover:bg-[var(--card)]"
                  >
                    + Agregar nueva dirección
                  </button>
                </div>
              )}
            </>
          )}

          {mode === "form" && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && (
                <p className="rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <label className={LABEL_CLASS}>
                Nombre del destinatario
                <input
                  name="recipient_name"
                  required
                  placeholder="ej. María García"
                  className={FIELD_CLASS}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={LABEL_CLASS}>
                  Departamento
                  <input
                    name="department"
                    required
                    placeholder="ej. Antioquia"
                    className={FIELD_CLASS}
                  />
                </label>
                <label className={LABEL_CLASS}>
                  Ciudad
                  <input
                    name="city"
                    required
                    placeholder="ej. Medellín"
                    className={FIELD_CLASS}
                  />
                </label>
              </div>

              <label className={LABEL_CLASS}>
                Dirección
                <input
                  name="address_line"
                  required
                  placeholder="ej. Cra 7 # 45-20 Apto 301"
                  className={FIELD_CLASS}
                />
              </label>

              <label className={LABEL_CLASS}>
                Barrio <span className="font-normal text-[var(--muted)]">(opcional)</span>
                <input
                  name="neighborhood"
                  placeholder="ej. El Poblado"
                  className={FIELD_CLASS}
                />
              </label>

              <label className={LABEL_CLASS}>
                Teléfono de contacto
                <input
                  name="phone"
                  required
                  type="tel"
                  placeholder="ej. 300 123 4567"
                  className={FIELD_CLASS}
                />
              </label>

              <input type="hidden" name="is_default" value="false" />

              <div className="flex gap-2 pt-1">
                {addresses !== null && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMode("list")}
                    className="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-semibold shadow-[2px_2px_0_0_#111] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Volver
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 rounded-xl border-2 border-black bg-[var(--accent)] px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#111] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40"
                >
                  {isSaving ? "Guardando..." : "Guardar y usar"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
