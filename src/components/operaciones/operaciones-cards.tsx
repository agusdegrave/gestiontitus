"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn, formatPriceARS, formatDateAR } from "@/lib/utils"
import { operacionProgress, totalDeudasVenta } from "@/types/ventas"
import { TipoChip } from "@/components/stock/chips"
import { EstadoOperacionChip, PagoChip } from "./operacion-chips"
import { OperacionDetailClient } from "./operacion-detail-client"
import type { Venta } from "@/types/ventas"

interface Props {
  ventas: Venta[]
  loading: boolean
  onSaved: () => void
}

// Anillo de progreso: naranja de marca mientras avanza, verde al 100%
function ProgressRing({ pct }: { pct: number }) {
  const size = 48
  const stroke = 4.5
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const complete = pct >= 100
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-stone-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(pct, 100) / 100)}
          className={cn(
            "transition-all duration-500",
            complete ? "stroke-green-500" : "stroke-brand-500"
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums",
          complete ? "text-green-600" : "text-foreground"
        )}
      >
        {pct}%
      </span>
    </div>
  )
}

function QuickDato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      {label} <span className="text-foreground font-medium">{children}</span>
    </span>
  )
}

function OperacionCard({ venta, expanded, onToggle, onSaved }: {
  venta: Venta
  expanded: boolean
  onToggle: () => void
  onSaved: () => void
}) {
  const auto = venta.autos
  const haContado = (venta.paga_contado ?? 0) > 0
  const haPermuta = (venta.paga_permuta ?? 0) > 0
  const haFinanciado = (venta.paga_financiado ?? 0) > 0
  const progreso = operacionProgress(venta)
  const deudas = totalDeudasVenta(venta)

  return (
    <div className="rounded-[14px] border border-border bg-card shadow-warm-sm overflow-hidden">
      {/* Fila colapsada (clickeable) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/30 cursor-pointer"
      >
        {/* Anillo de progreso global */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <ProgressRing pct={progreso.pct} />
          <span
            className={cn(
              "text-[11px] font-medium tabular-nums",
              progreso.done === progreso.total ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {progreso.done}/{progreso.total}
          </span>
        </div>

        {/* Auto + datos rápidos */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-semibold text-sm tracking-wider text-foreground">
              {auto?.dominio ?? "—"}
            </span>
            <span className="text-sm text-muted-foreground truncate">
              {auto ? `${auto.marca} ${auto.modelo}${auto.anio ? ` (${auto.anio})` : ""}` : ""}
            </span>
            {auto?.tipo && <TipoChip tipo={auto.tipo} />}
            <EstadoOperacionChip estado={venta.estado_operacion} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <QuickDato label="Seña:">{formatDateAR(venta.fecha_senia)}</QuickDato>
            {venta.fecha_entrega ? (
              <QuickDato label="Entrega:">{formatDateAR(venta.fecha_entrega)}</QuickDato>
            ) : venta.fecha_tentativa_entrega ? (
              <QuickDato label="Tentativa:">{formatDateAR(venta.fecha_tentativa_entrega)}</QuickDato>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Forma de pago:
              {haContado && <PagoChip label="Contado" color="green" />}
              {haPermuta && <PagoChip label="Permuta" color="purple" />}
              {haFinanciado && <PagoChip label="Financiado" color="blue" />}
              {!haContado && !haPermuta && !haFinanciado && "—"}
            </span>
            <QuickDato label="Vendedor:">
              {venta.vendedor
                ? `${venta.vendedor.nombre} ${venta.vendedor.apellido.charAt(0)}.`
                : "—"}
            </QuickDato>
          </div>
        </div>

        {/* Badge de deudas + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {deudas > 0 && (
            <span className="inline-flex items-center rounded-[8px] bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold tabular-nums">
              Deuda: {formatPriceARS(deudas)}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Detalle desplegado: las mismas cards de la ficha de operación */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border bg-stone-50/60 px-4 py-4">
            {/* Montado solo al expandir: carga el detalle fresco cada vez */}
            {expanded && (
              <OperacionDetailClient ventaId={venta.id} embedded onSaved={onSaved} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function OperacionesCards({ ventas, loading, onSaved }: Props) {
  // Una sola abierta a la vez: la lista queda fácil de escanear
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <span className="animate-pulse">Cargando operaciones...</span>
      </div>
    )
  }

  if (ventas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-base font-medium text-foreground">Sin resultados</p>
        <p className="text-sm text-muted-foreground">No hay operaciones que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {ventas.map((v) => (
        <OperacionCard
          key={v.id}
          venta={v}
          expanded={expandedId === v.id}
          onToggle={() => setExpandedId((p) => (p === v.id ? null : v.id))}
          onSaved={onSaved}
        />
      ))}
    </div>
  )
}
