import { cn } from "@/lib/utils"
import type { TipoAuto, EstadoAuto, CalificacionPrecio } from "@/types/stock"
import { ESTADO_LABELS, CALIFICACION_LABELS } from "@/types/stock"

const ESTADO_STYLES: Record<EstadoAuto, string> = {
  por_ingresar: "bg-stone-100 text-stone-600",
  en_alistaje: "bg-amber-100 text-amber-700",
  activo:       "bg-green-100 text-green-700",
  senado:       "bg-blue-100 text-blue-700",
  vendido:      "bg-purple-100 text-purple-700",
}

const CALIFICACION_STYLES: Record<CalificacionPrecio, string> = {
  barato: "bg-green-100 text-green-700",
  bien:   "bg-blue-100 text-blue-700",
  caro:   "bg-red-100 text-red-700",
}

export function EstadoChip({ estado }: { estado: EstadoAuto }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        ESTADO_STYLES[estado]
      )}
    >
      {ESTADO_LABELS[estado]}
    </span>
  )
}

export function TipoChip({ tipo }: { tipo: TipoAuto }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        tipo === "propio"
          ? "bg-brand-100 text-brand-700"
          : "bg-stone-100 text-stone-600"
      )}
    >
      {tipo === "propio" ? "Propio" : "Consigna"}
    </span>
  )
}

export function CalificacionChip({ calificacion }: { calificacion: CalificacionPrecio | null }) {
  if (!calificacion) return null
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        CALIFICACION_STYLES[calificacion]
      )}
    >
      {CALIFICACION_LABELS[calificacion]}
    </span>
  )
}
