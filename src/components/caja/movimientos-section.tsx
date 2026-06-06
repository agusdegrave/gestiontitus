"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchMovimientos, MOVIMIENTOS_PAGE_SIZE } from "@/lib/caja"
import { formatPriceARS, formatPriceUSD, formatDateAR, cn } from "@/lib/utils"
import type { CajaSaldo, CajaMovimiento, MovimientoFilters } from "@/types/caja"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function unMesAtrasISO() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 10)
}

interface Props {
  cajas: CajaSaldo[]
  // El padre lo incrementa tras guardar un movimiento/transferencia para refrescar
  refreshKey: number
  // Preselección de caja desde "Ver movimientos" del menú de una tarjeta
  cajaPreseleccionada: string | null
}

export function MovimientosSection({ cajas, refreshKey, cajaPreseleccionada }: Props) {
  const [movimientos, setMovimientos] = useState<CajaMovimiento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const [filters, setFilters] = useState<MovimientoFilters>({
    categoria: "",
    caja_id: "",
    tipo: "",
    desde: unMesAtrasISO(),
    hasta: todayISO(),
  })
  const [debouncedCategoria, setDebouncedCategoria] = useState("")

  // Debounce del filtro de categoría
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCategoria(filters.categoria), 400)
    return () => clearTimeout(t)
  }, [filters.categoria])

  // "Ver movimientos" de una caja: aplica el filtro
  useEffect(() => {
    if (cajaPreseleccionada) {
      setFilters((p) => ({ ...p, caja_id: cajaPreseleccionada }))
    }
  }, [cajaPreseleccionada])

  const activeFilters: MovimientoFilters = { ...filters, categoria: debouncedCategoria }

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const result = await fetchMovimientos(activeFilters, page)
    setLoading(false)
    if (result.error) {
      setLoadError(`No se pudieron cargar los movimientos: ${result.error.message}`)
      return
    }
    setMovimientos((result.data as unknown as CajaMovimiento[]) ?? [])
    setTotal(result.count ?? 0)
  }, [debouncedCategoria, filters.caja_id, filters.tipo, filters.desde, filters.hasta, page, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [debouncedCategoria, filters.caja_id, filters.tipo, filters.desde, filters.hasta])

  const totalPages = Math.ceil(total / MOVIMIENTOS_PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Movimientos recientes</h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {loading ? "..." : `${total} movimiento${total === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={filters.categoria}
            onChange={(e) => setFilters((p) => ({ ...p, categoria: e.target.value }))}
            placeholder="Categoría..."
            className="pl-8 rounded-[10px]"
          />
        </div>
        <Select
          value={filters.caja_id || "all"}
          onValueChange={(v) => setFilters((p) => ({ ...p, caja_id: v === "all" ? "" : (v ?? "") }))}
        >
          <SelectTrigger className="rounded-[10px] w-[170px]">
            <SelectValue placeholder="Caja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cajas</SelectItem>
            {cajas.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.tipo || "all"}
          onValueChange={(v) => setFilters((p) => ({ ...p, tipo: v === "all" ? "" : (v ?? "") }))}
        >
          <SelectTrigger className="rounded-[10px] w-[130px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ingreso">Ingreso</SelectItem>
            <SelectItem value="egreso">Egreso</SelectItem>
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input
            type="date"
            value={filters.desde}
            onChange={(e) => setFilters((p) => ({ ...p, desde: e.target.value }))}
            className="rounded-[10px] w-[150px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input
            type="date"
            value={filters.hasta}
            onChange={(e) => setFilters((p) => ({ ...p, hasta: e.target.value }))}
            className="rounded-[10px] w-[150px]"
          />
        </div>
      </div>

      {loadError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : movimientos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-1">
          <p className="text-sm font-medium text-foreground">Sin movimientos</p>
          <p className="text-sm text-muted-foreground">
            No hay movimientos en el período y filtros elegidos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-warm-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>Fecha</Th>
                <Th>Tipo</Th>
                <Th>Concepto</Th>
                <Th className="text-right">Monto</Th>
                <Th>Caja</Th>
                <Th>Vehículo</Th>
                <Th>Categoría</Th>
                <Th>Usuario</Th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, i) => {
                const esIngreso = m.tipo === "ingreso"
                const fmt = m.cajas?.moneda === "USD" ? formatPriceUSD : formatPriceARS
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      "border-b border-border last:border-0",
                      i % 2 === 0 ? "" : "bg-muted/10"
                    )}
                  >
                    <Td className="text-muted-foreground tabular-nums">{formatDateAR(m.fecha)}</Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
                          esIngreso ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}
                      >
                        {esIngreso ? "Ingreso" : "Egreso"}
                      </span>
                    </Td>
                    <Td className="max-w-[260px]">
                      <span className="block truncate" title={m.concepto ?? undefined}>
                        {m.concepto ?? "—"}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <span
                        className={cn(
                          "tabular-nums font-medium",
                          esIngreso ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {esIngreso ? "+" : "−"}{fmt(m.monto)}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">{m.cajas?.nombre ?? "—"}</Td>
                    <Td className="font-mono text-[13px]">{m.autos?.dominio ?? "—"}</Td>
                    <Td className="text-muted-foreground">{m.categoria ?? "—"}</Td>
                    <Td className="text-muted-foreground">
                      {m.usuario ? `${m.usuario.nombre} ${m.usuario.apellido}` : "—"}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} · {total} movimientos
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-[10px] h-8 gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-[10px] h-8 gap-1"
            >
              Siguiente
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
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
