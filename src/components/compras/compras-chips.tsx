import { cn } from "@/lib/utils"
import type { OrigenCompra } from "@/types/compras"
import { ORIGEN_LABELS } from "@/types/compras"

const ORIGEN_STYLES: Record<OrigenCompra, string> = {
  calle: "bg-blue-100 text-blue-700",
  permuta: "bg-amber-100 text-amber-700",
  consigna_comprada: "bg-purple-100 text-purple-700",
}

export function OrigenChip({ origen }: { origen: OrigenCompra }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        ORIGEN_STYLES[origen]
      )}
    >
      {ORIGEN_LABELS[origen]}
    </span>
  )
}

export function PorcentajeChip({ total }: { total: number }) {
  const completo = Math.abs(total - 100) < 0.01
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-semibold",
        completo ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      )}
    >
      {completo ? "✓ 100%" : `${new Intl.NumberFormat("es-AR").format(total)}%`}
    </span>
  )
}

export function ActivoChip({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"
      )}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  )
}
