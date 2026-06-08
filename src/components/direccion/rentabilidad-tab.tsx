"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchRentabilidad } from "@/lib/direccion"
import { formatPriceARS, cn } from "@/lib/utils"
import type { RentabilidadAuto } from "@/types/direccion"

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-white px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-lg font-bold mt-0.5", valueClass ?? "text-foreground")}>{value}</p>
    </div>
  )
}

function Ganancia({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn("font-semibold", value >= 0 ? "text-green-700" : "text-red-600")}>
      {formatPriceARS(value)}
    </span>
  )
}

// Estado de resultados por auto desde la vista rentabilidad_auto
export function RentabilidadTab() {
  const [rows, setRows] = useState<RentabilidadAuto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tipo, setTipo] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await fetchRentabilidad()
      setLoading(false)
      if (err) {
        setError(`Error al cargar rentabilidad: ${err.message}`)
        return
      }
      setRows(data)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let r = rows
    if (tipo !== "all") r = r.filter((x) => x.tipo === tipo)
    if (search.trim()) {
      const s = search.trim().toUpperCase()
      r = r.filter((x) => x.dominio?.toUpperCase().includes(s))
    }
    return r
  }, [rows, tipo, search])

  const totales = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.ganancia += r.ganancia ?? 0
        acc.vendido += r.precio_venta ?? 0
        acc.gastos += r.gastos_ars ?? 0
        return acc
      },
      { ganancia: 0, vendido: 0, gastos: 0 }
    )
  }, [filtered])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Ganancia total"
          value={formatPriceARS(totales.ganancia)}
          valueClass={totales.ganancia >= 0 ? "text-green-700" : "text-red-600"}
        />
        <StatCard label="Total vendido" value={formatPriceARS(totales.vendido)} />
        <StatCard label="Total gastos" value={formatPriceARS(totales.gastos)} />
        <StatCard label="Operaciones" value={String(filtered.length)} />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por dominio..."
            className="h-9 rounded-[10px] pl-9 uppercase"
          />
        </div>
        <Select value={tipo} onValueChange={(v) => setTipo(v ?? "all")}>
          <SelectTrigger className="w-40 h-9 rounded-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="propio">Propio</SelectItem>
            <SelectItem value="consigna">Consigna</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-[14px] border border-border bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Sin resultados para los filtros aplicados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="px-4 py-3 font-semibold">Dominio</th>
                <th className="px-4 py-3 font-semibold">Auto</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold text-right">Precio venta</th>
                <th className="px-4 py-3 font-semibold text-right">Compra</th>
                <th className="px-4 py-3 font-semibold text-right">Gastos</th>
                <th className="px-4 py-3 font-semibold text-right">Comisión</th>
                <th className="px-4 py-3 font-semibold text-right">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((r) => (
                <tr key={r.auto_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold tracking-wider whitespace-nowrap">
                    {r.dominio}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {r.marca} {r.modelo}
                    {r.anio ? ` (${r.anio})` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-[8px] text-xs font-medium",
                        r.tipo === "propio"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      )}
                    >
                      {r.tipo === "propio" ? "Propio" : "Consigna"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatPriceARS(r.precio_venta)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                    {formatPriceARS(r.precio_compra)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                    {formatPriceARS(r.gastos_ars)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                    {formatPriceARS(r.comision)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Ganancia value={r.ganancia} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
