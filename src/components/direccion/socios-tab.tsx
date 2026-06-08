"use client"

import { useState, useEffect } from "react"
import { Loader2, Info } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchAutosConParticipacion, fetchParticipaciones, fetchRentabilidadAuto } from "@/lib/direccion"
import { formatPriceARS, formatPriceUSD, formatNumber, cn } from "@/lib/utils"
import type { AutoConParticipacion, ParticipacionSocio, RentabilidadAuto } from "@/types/direccion"

// Liquidación de socios: ganancia del auto × porcentaje de participación
export function SociosTab() {
  const [autos, setAutos] = useState<AutoConParticipacion[]>([])
  const [loadingAutos, setLoadingAutos] = useState(true)
  const [autoId, setAutoId] = useState("")

  const [participaciones, setParticipaciones] = useState<ParticipacionSocio[]>([])
  const [rentabilidad, setRentabilidad] = useState<RentabilidadAuto | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoadingAutos(true)
      const { data, error: err } = await fetchAutosConParticipacion()
      setLoadingAutos(false)
      if (err) {
        setError(`Error al cargar autos: ${err.message}`)
        return
      }
      setAutos(data)
    }
    load()
  }, [])

  useEffect(() => {
    if (!autoId) {
      setParticipaciones([])
      setRentabilidad(null)
      return
    }
    async function loadDetalle() {
      setLoadingDetalle(true)
      setError(null)
      const [partRes, rentRes] = await Promise.all([
        fetchParticipaciones(autoId),
        fetchRentabilidadAuto(autoId),
      ])
      setLoadingDetalle(false)
      if (partRes.error) {
        setError(`Error al cargar participaciones: ${partRes.error.message}`)
        return
      }
      if (rentRes.error) {
        setError(`Error al cargar rentabilidad: ${rentRes.error.message}`)
        return
      }
      setParticipaciones(partRes.data)
      setRentabilidad(rentRes.data)
    }
    loadDetalle()
  }, [autoId])

  if (loadingAutos) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const ganancia = rentabilidad?.ganancia ?? null

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Selector de auto */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Auto propio con participación
        </p>
        <Select value={autoId} onValueChange={(v) => setAutoId(v ?? "")}>
          <SelectTrigger className="w-full max-w-md h-10 rounded-[10px]">
            <SelectValue placeholder="Seleccioná un auto..." />
          </SelectTrigger>
          <SelectContent>
            {autos.length === 0 ? (
              <SelectItem value="" disabled>
                No hay autos con participación cargada
              </SelectItem>
            ) : (
              autos.map((a) => (
                <SelectItem key={a.auto_id} value={a.auto_id}>
                  {a.dominio} — {a.marca} {a.modelo}
                  {a.anio ? ` (${a.anio})` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      {loadingDetalle && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {autoId && !loadingDetalle && !error && (
        <>
          {/* Ganancia del auto */}
          <div className="rounded-[14px] border border-border bg-white px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Ganancia del auto{rentabilidad ? "" : " (sin venta registrada todavía)"}
            </p>
            <p
              className={cn(
                "text-lg font-bold",
                ganancia == null
                  ? "text-muted-foreground"
                  : ganancia >= 0
                  ? "text-green-700"
                  : "text-red-600"
              )}
            >
              {ganancia == null ? "—" : formatPriceARS(ganancia)}
            </p>
          </div>

          {/* Tabla de socios */}
          <div className="rounded-[14px] border border-border bg-white overflow-hidden">
            {participaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Este auto no tiene participaciones cargadas.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="px-4 py-3 font-semibold">Socio</th>
                    <th className="px-4 py-3 font-semibold text-right">%</th>
                    <th className="px-4 py-3 font-semibold text-right">Capital aportado</th>
                    <th className="px-4 py-3 font-semibold text-right">Ganancia que le corresponde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {participaciones.map((p) => {
                    const cuota =
                      ganancia != null && p.porcentaje != null
                        ? (ganancia * p.porcentaje) / 100
                        : null
                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-foreground">
                          {p.socios
                            ? `${p.socios.nombre}${p.socios.apellido ? ` ${p.socios.apellido}` : ""}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {p.porcentaje != null ? `${formatNumber(p.porcentaje)}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                          {p.capital_aportado == null
                            ? "—"
                            : p.moneda === "USD"
                            ? formatPriceUSD(p.capital_aportado)
                            : formatPriceARS(p.capital_aportado)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {cuota == null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span
                              className={cn(
                                "font-semibold",
                                cuota >= 0 ? "text-green-700" : "text-red-600"
                              )}
                            >
                              {formatPriceARS(cuota)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Aclaración */}
          <p className="flex items-start gap-2 text-xs text-muted-foreground rounded-[10px] bg-muted/40 px-3 py-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Liquidación estimada: se calcula sobre la ganancia actual del auto según la vista de
            rentabilidad (venta − compra − gastos − comisión). Puede cambiar si se cargan más gastos.
          </p>
        </>
      )}
    </div>
  )
}
