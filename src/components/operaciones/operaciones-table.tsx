"use client"

import { Eye } from "lucide-react"
import { formatPriceARS } from "@/lib/utils"
import { ESTADO_OPERACION_LABELS } from "@/types/ventas"
import type { Venta } from "@/types/ventas"

interface Props {
  ventas: Venta[]
  loading: boolean
  onView: (v: Venta) => void
}

export function OperacionesTable({ ventas, loading, onView }: Props) {
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
    <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-warm-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Fecha seña</Th>
            <Th>Auto</Th>
            <Th>Comprador</Th>
            <Th>Vendedor</Th>
            <Th className="text-right">Precio venta</Th>
            <Th>Pago</Th>
            <Th>Estado</Th>
            <Th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {ventas.map((v, i) => {
            const auto = v.autos
            const vendedor = v.vendedor
            const haContado = (v.paga_contado ?? 0) > 0
            const haPermuta = (v.paga_permuta ?? 0) > 0
            const haFinanciado = (v.paga_financiado ?? 0) > 0

            return (
              <tr
                key={v.id}
                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                onClick={() => onView(v)}
              >
                <Td>
                  <span className="text-muted-foreground tabular-nums">
                    {v.fecha_senia
                      ? new Date(v.fecha_senia + "T00:00:00").toLocaleDateString("es-AR")
                      : "—"}
                  </span>
                </Td>
                <Td>
                  {auto ? (
                    <div className="flex flex-col">
                      <span className="font-mono font-semibold text-[13px] tracking-wider text-foreground">
                        {auto.dominio}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {auto.marca} {auto.modelo}{auto.anio ? ` ${auto.anio}` : ""}
                      </span>
                    </div>
                  ) : "—"}
                </Td>
                <Td>
                  <span className="font-medium">{v.comprador_nombre}</span>{" "}
                  <span className="text-muted-foreground">{v.comprador_apellido}</span>
                </Td>
                <Td className="text-muted-foreground">
                  {vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : "—"}
                </Td>
                <Td className="text-right tabular-nums font-medium">
                  {formatPriceARS(v.precio_venta)}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {haContado && <PagoChip label="Contado" color="green" />}
                    {haPermuta && <PagoChip label="Permuta" color="purple" />}
                    {haFinanciado && <PagoChip label="Financiado" color="blue" />}
                  </div>
                </Td>
                <Td>
                  <EstadoChip estado={v.estado_operacion} />
                </Td>
                <Td>
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(v) }}
                    className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${className ?? ""}`}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-2.5 align-middle whitespace-nowrap ${className ?? ""}`}>
      {children}
    </td>
  )
}

function EstadoChip({ estado }: { estado: Venta["estado_operacion"] }) {
  const styles: Record<string, string> = {
    senado: "bg-blue-100 text-blue-700",
    entregado: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium ${styles[estado] ?? "bg-stone-100 text-stone-600"}`}>
      {ESTADO_OPERACION_LABELS[estado] ?? estado}
    </span>
  )
}

function PagoChip({ label, color }: { label: string; color: "green" | "purple" | "blue" }) {
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
