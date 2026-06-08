"use client"

import { useState, useEffect, Fragment } from "react"
import { Loader2, ChevronDown, ChevronRight, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetchVentasDelMes } from "@/lib/direccion"
import { formatPriceARS, formatDateAR, cn } from "@/lib/utils"
import { liquidarComisiones, extraPorAuto, type LiquidacionVendedor } from "@/types/direccion"

function mesActual(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

// Liquidación de comisiones por vendedor y mes:
// base = suma de comision_base; extra por objetivo según autos vendidos
// (>=10: $150.000/auto, >=7: $100.000/auto), penalizado por margen usado.
export function ComisionesTab() {
  const [mes, setMes] = useState(mesActual)
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionVendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!/^\d{4}-\d{2}$/.test(mes)) return
    async function load() {
      setLoading(true)
      setError(null)
      const [y, m] = mes.split("-").map(Number)
      const { data, error: err } = await fetchVentasDelMes(y, m)
      setLoading(false)
      if (err) {
        setError(`Error al cargar ventas del mes: ${err.message}`)
        return
      }
      setLiquidaciones(liquidarComisiones(data))
      setExpanded(null)
    }
    load()
  }, [mes])

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mes</p>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="h-9 rounded-[10px] w-44"
          />
        </div>
      </div>

      {/* Reglas */}
      <p className="flex items-start gap-2 text-xs text-muted-foreground rounded-[10px] bg-muted/40 px-3 py-2 max-w-3xl">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        Extra por objetivo: con 10 o más autos vendidos en el mes, $ 150.000 por auto; con 7 a 9,
        $ 100.000 por auto; con menos de 7, sin extra. En cada auto el extra se reduce según el
        margen usado: sin margen usado cobra el extra completo; si usó todo el margen, no cobra extra
        por ese auto.
      </p>

      {error && (
        <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : liquidaciones.length === 0 ? (
        !error && (
          <div className="rounded-[14px] border border-border bg-white">
            <p className="text-sm text-muted-foreground text-center py-10">
              No hay ventas señadas en este mes.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-[14px] border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="px-4 py-3 font-semibold w-8" />
                <th className="px-4 py-3 font-semibold">Vendedor</th>
                <th className="px-4 py-3 font-semibold text-right">Autos vendidos</th>
                <th className="px-4 py-3 font-semibold text-right">Comisión base</th>
                <th className="px-4 py-3 font-semibold text-right">Extra por objetivo</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {liquidaciones.map((l) => {
                const isOpen = expanded === l.vendedor_id
                const extraUnitario = extraPorAuto(l.autosVendidos)
                return (
                  <Fragment key={l.vendedor_id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : l.vendedor_id)}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{l.nombre}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-[8px] text-xs font-semibold",
                            l.autosVendidos >= 10
                              ? "bg-green-50 text-green-700"
                              : l.autosVendidos >= 7
                              ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-600"
                          )}
                        >
                          {l.autosVendidos}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {formatPriceARS(l.comisionBase)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {l.extraTotal > 0 ? (
                          <span className="text-green-700 font-medium">
                            {formatPriceARS(l.extraTotal)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatPriceARS(0)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                        {formatPriceARS(l.total)}
                      </td>
                    </tr>

                    {/* Detalle por auto */}
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="px-4 pb-4 pt-1 bg-muted/20">
                          <div className="rounded-[12px] border border-border bg-white overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-stone-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                                  <th className="px-3 py-2 font-semibold">Fecha seña</th>
                                  <th className="px-3 py-2 font-semibold">Dominio</th>
                                  <th className="px-3 py-2 font-semibold">Auto</th>
                                  <th className="px-3 py-2 font-semibold text-right">Comisión base</th>
                                  <th className="px-3 py-2 font-semibold text-right">Margen usado</th>
                                  <th className="px-3 py-2 font-semibold text-right">Extra de este auto</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100">
                                {l.detalle.map(({ venta, extra }) => (
                                  <tr key={venta.id}>
                                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                      {formatDateAR(venta.fecha_senia)}
                                    </td>
                                    <td className="px-3 py-2 font-mono font-semibold tracking-wider whitespace-nowrap">
                                      {venta.autos?.dominio ?? "—"}
                                    </td>
                                    <td className="px-3 py-2 text-foreground">
                                      {venta.autos ? `${venta.autos.marca} ${venta.autos.modelo}` : "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">
                                      {formatPriceARS(venta.comision_base)}
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">
                                      {formatPriceARS(venta.margen_usado ?? 0)}
                                      {(venta.margen_disponible ?? 0) > 0 && (
                                        <span className="text-xs">
                                          {" "}/ {formatPriceARS(venta.margen_disponible)}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                                      {extraUnitario === 0 ? (
                                        <span className="text-muted-foreground">Sin objetivo</span>
                                      ) : (
                                        <span className={extra > 0 ? "text-green-700" : "text-muted-foreground"}>
                                          {formatPriceARS(Math.round(extra))}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
