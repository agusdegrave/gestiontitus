import { cn } from "@/lib/utils"
import { ESTADO_OPERACION_LABELS } from "@/types/ventas"
import type { EstadoOperacion } from "@/types/ventas"

const ESTADO_OPERACION_STYLES: Record<EstadoOperacion, string> = {
  senado: "bg-amber-100 text-amber-700",
  en_proceso: "bg-blue-100 text-blue-700",
  entregado: "bg-green-100 text-green-700",
}

export function EstadoOperacionChip({ estado }: { estado: EstadoOperacion }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        ESTADO_OPERACION_STYLES[estado] ?? "bg-stone-100 text-stone-600"
      )}
    >
      {ESTADO_OPERACION_LABELS[estado] ?? estado}
    </span>
  )
}

export function PagoChip({ label, color }: { label: string; color: "green" | "purple" | "blue" }) {
  const styles = {
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  }
  return (
    <span className={`inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium ${styles[color]}`}>
      {label}
    </span>
  )
}
