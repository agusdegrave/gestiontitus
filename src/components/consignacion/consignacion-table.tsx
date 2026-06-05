"use client"

import Link from "next/link"
import { Loader2, ExternalLink } from "lucide-react"
import { formatPriceARS } from "@/lib/utils"
import { EstadoChip } from "@/components/stock/chips"
import { TipoConsignaChip, VerifChip, InformeEstadoChip } from "./consignacion-chips"
import type { ConsignacionRow } from "@/types/consignacion"

interface Props {
  rows: ConsignacionRow[]
  loading: boolean
}

export function ConsignacionTable({ rows, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No hay consignas que coincidan.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[14px] border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-stone-50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Dominio</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Vehículo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Dueño</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Exclus.</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Verificación</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Informes</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const infDominio = row.informes.find((i) => i.tipo === "dominio")
              const infMultas = row.informes.find((i) => i.tipo === "multas")
              const duenio = row.consignacion
                ? [row.consignacion.duenio_nombre, row.consignacion.duenio_apellido]
                    .filter(Boolean)
                    .join(" ") || "—"
                : "—"

              return (
                <tr
                  key={row.id}
                  className="hover:bg-stone-50/60 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-foreground whitespace-nowrap">
                    {row.dominio || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-foreground">
                      {row.marca} {row.modelo}
                    </span>
                    {row.anio && (
                      <span className="text-muted-foreground ml-1">({row.anio})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">{duenio}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.consignacion ? (
                      <TipoConsignaChip tipo={row.consignacion.tipo} />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.consignacion ? (
                      <span
                        className={
                          row.consignacion.exclusividad
                            ? "text-xs font-medium text-brand-600"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {row.consignacion.exclusividad ? "Sí" : "No"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground">
                    {formatPriceARS(row.precio_publicado) || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EstadoChip estado={row.estado} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.verificacion ? (
                      <VerifChip estado={row.verificacion.estado} />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {infDominio && (
                        <InformeEstadoChip tipo="dominio" estado={infDominio.estado} />
                      )}
                      {infMultas && (
                        <InformeEstadoChip tipo="multas" estado={infMultas.estado} />
                      )}
                      {!infDominio && !infMultas && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/consignacion/${row.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-stone-100 transition-colors"
                      title="Ver detalle"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
