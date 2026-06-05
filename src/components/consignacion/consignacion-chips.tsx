import { cn } from "@/lib/utils"
import type { TipoConsigna, EstadoVerif, EstadoInforme, TipoInforme } from "@/types/consignacion"
import {
  TIPO_CONSIGNA_LABELS,
  ESTADO_VERIF_LABELS,
  ESTADO_INFORME_LABELS,
} from "@/types/consignacion"

export function TipoConsignaChip({ tipo }: { tipo: TipoConsigna }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        tipo === "fisica"
          ? "bg-brand-100 text-brand-700"
          : "bg-purple-100 text-purple-700"
      )}
    >
      {TIPO_CONSIGNA_LABELS[tipo]}
    </span>
  )
}

const VERIF_STYLES: Record<EstadoVerif, string> = {
  pendiente: "bg-stone-100 text-stone-600",
  turno_sacado: "bg-blue-100 text-blue-700",
  hecha: "bg-green-100 text-green-700",
  observada: "bg-red-100 text-red-700",
}

export function VerifChip({ estado }: { estado: EstadoVerif }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        VERIF_STYLES[estado]
      )}
    >
      {ESTADO_VERIF_LABELS[estado]}
    </span>
  )
}

const INFORME_STYLES: Record<EstadoInforme, string> = {
  pendiente: "bg-stone-100 text-stone-600",
  solicitado: "bg-blue-100 text-blue-700",
  recibido: "bg-amber-100 text-amber-700",
  ok: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
}

export function InformeEstadoChip({
  tipo,
  estado,
}: {
  tipo: TipoInforme
  estado: EstadoInforme
}) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-muted-foreground capitalize">{tipo === "dominio" ? "Dom" : "Mul"}:</span>
      <span
        className={cn(
          "inline-flex items-center rounded-[6px] px-1.5 py-0.5 font-medium",
          INFORME_STYLES[estado]
        )}
      >
        {ESTADO_INFORME_LABELS[estado]}
      </span>
    </span>
  )
}
