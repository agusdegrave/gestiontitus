"use client"

import { Pencil, Trash2 } from "lucide-react"
import { EstadoChip, TipoChip, CalificacionChip } from "./chips"
import { formatPriceARS, formatNumber } from "@/lib/utils"
import type { Auto } from "@/types/stock"

interface Props {
  autos: Auto[]
  loading: boolean
  canEdit: (a: Auto) => boolean
  canDelete: (a: Auto) => boolean
  onEdit: (a: Auto) => void
  onDelete: (a: Auto) => void
}

export function StockTable({ autos, loading, canEdit, canDelete, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        <span className="animate-pulse">Cargando autos...</span>
      </div>
    )
  }

  if (autos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-base font-medium text-foreground">Sin resultados</p>
        <p className="text-sm text-muted-foreground">No hay autos que coincidan con los filtros.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-warm-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <Th>Dominio</Th>
            <Th>Marca / Modelo</Th>
            <Th>Versión</Th>
            <Th className="text-right">Año</Th>
            <Th className="text-right">KM</Th>
            <Th>Color</Th>
            <Th>Tipo</Th>
            <Th>Estado</Th>
            <Th className="text-right">Publicado</Th>
            <Th className="text-right">Margen</Th>
            <Th>Responsable</Th>
            <Th className="w-16" />
          </tr>
        </thead>
        <tbody>
          {autos.map((auto, i) => (
            <tr
              key={auto.id}
              className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <Td>
                <span className="font-mono font-semibold text-[13px] tracking-wider text-foreground">
                  {auto.dominio}
                </span>
              </Td>
              <Td>
                <span className="font-medium">{auto.marca}</span>{" "}
                <span className="text-muted-foreground">{auto.modelo}</span>
              </Td>
              <Td className="text-muted-foreground max-w-[120px] truncate">{auto.version ?? "—"}</Td>
              <Td className="text-right tabular-nums">{auto.anio ?? "—"}</Td>
              <Td className="text-right tabular-nums">{formatNumber(auto.km)}</Td>
              <Td className="text-muted-foreground">{auto.color ?? "—"}</Td>
              <Td><TipoChip tipo={auto.tipo} /></Td>
              <Td><EstadoChip estado={auto.estado} /></Td>
              <Td className="text-right tabular-nums font-medium">
                <div className="flex flex-col items-end gap-0.5">
                  <span>{formatPriceARS(auto.precio_publicado)}</span>
                  {auto.calificacion_precio && (
                    <CalificacionChip calificacion={auto.calificacion_precio} />
                  )}
                </div>
              </Td>
              <Td className="text-right tabular-nums">
                {auto.margen != null ? (
                  <span className={auto.margen >= 0 ? "text-green-700" : "text-red-600"}>
                    {formatPriceARS(auto.margen)}
                  </span>
                ) : "—"}
              </Td>
              <Td className="text-muted-foreground">
                {auto.responsable
                  ? `${auto.responsable.nombre} ${auto.responsable.apellido}`
                  : "—"}
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  {canEdit(auto) && (
                    <button
                      onClick={() => onEdit(auto)}
                      className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete(auto) && (
                    <button
                      onClick={() => onDelete(auto)}
                      className="p-1.5 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
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
