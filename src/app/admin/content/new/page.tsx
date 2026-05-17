import { createContent } from "@/app/admin/content/actions";
import Button from "@/app/components/Button";

export default function AdminNewContentPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Nuevo contenido</h1>
      <form action={createContent} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="key" className="block text-sm font-semibold">
            Clave
          </label>
          <input
            id="key"
            name="key"
            required
            className="w-full rounded-xl border-2 border-black p-3 text-sm shadow-[3px_3px_0_0_#111] focus:outline-none focus:ring-2 focus:ring-black font-mono"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="value" className="block text-sm font-semibold">
            Valor
          </label>
          <textarea
            id="value"
            name="value"
            rows={8}
            className="w-full rounded-xl border-2 border-black p-3 text-sm shadow-[3px_3px_0_0_#111] focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="pinned"
            className="h-4 w-4 rounded border-2 border-black accent-[var(--accent)]"
          />
          <span className="text-sm font-semibold">Inyectar siempre en el asistente</span>
        </label>
        <div className="flex gap-3">
          <Button variant="primary" size="xl" shadow type="submit">
            Crear
          </Button>
          <Button href="/admin/content" variant="secondary" size="xl" shadow>
            Cancelar
          </Button>
        </div>
      </form>
    </section>
  );
}
