"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { formatPriceARS, formatPriceUSD } from "@/lib/utils"
import {
  fetchCompras,
  fetchPendientes,
  fetchAutosConsigna,
  fetchSocios,
  deleteCompra,
  PAGE_SIZE,
} from "@/lib/compras"
import { OrigenChip, PorcentajeChip } from "./compras-chips"
import { CompraForm } from "./compra-form"
import type { CompraRow, ComprasFilters, AutoCompra, Socio } from "@/types/compras"

const ROLES_ELIMINAR = ["director", "admin"]

const EMPTY_FILTERS: ComprasFilters = { search: "", origen: "" }

function formatFecha(fecha: string | null): string {
  if (!fecha) return "—"
  return new Date(`${fecha.split("T")[0]}T00:00:00`).toLocaleDateString("es-AR")
}

export function ComprasTab() {
  const { usuario } = useAuth()

  const [rows, setRows] = useState<CompraRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<ComprasFilters>(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [pendientes, setPendientes] = useState<AutoCompra[]>([])
  const [loadingPendientes, setLoadingPendientes] = useState(true)
  const [consignas, setConsignas] = useState<AutoCompra[]>([])
  const [socios, setSocios] = useState<Socio[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [preselectAutoId, setPreselectAutoId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canDelete = usuario ? ROLES_ELIMINAR.includes(usuario.rol) : false

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const loadCompras = useCallback(async () => {
    setLoading(true)
    setPageError(null)
    const result = await fetchCompras({ ...filters, search: debouncedSearch }, page)
    setLoading(false)
    if (result.error) {
      setPageError(`No se pudieron cargar las compras: ${result.error.message}`)
      return
    }
    setRows(result.data)
    setTotal(result.count ?? 0)
  }, [debouncedSearch, filters.origen, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPendientes = useCallback(async () => {
    setLoadingPendientes(true)
    const { data, error } = await fetchPendientes()
    setLoadingPendientes(false)
    if (error) {
      setPageError(`No se pudieron cargar los pendientes: ${error.message}`)
      return
    }
    setPendientes(data)
  }, [])

  useEffect(() => { loadCompras() }, [loadCompras])
  useEffect(() => { loadPendientes() }, [loadPendientes])
  useEffect(() => { setPage(0) }, [filters, debouncedSearch])

  // Datos auxiliares del form
  useEffect(() => {
    fetchAutosConsigna().then(({ data }) => setConsignas(data))
    fetchSocios("").then(({ data }) => setSocios((data as Socio[]) ?? []))
  }, [formOpen]) // se refrescan al abrir/cerrar el form

  function openForm(autoId?: string) {
    setPreselectAutoId(autoId ?? null)
    setFormOpen(true)
  }

  function handleSaved() {
    setFormOpen(false)
    loadCompras()
    loadPendientes()
  }

  async function handleDelete(row: CompraRow) {
    const auto = row.autos?.dominio ?? "este auto"
    if (!confirm(`¿Eliminar la compra de ${auto}? Se borra también la participación de socios.`)) return
    setDeletingId(row.id)
    const { error } = await deleteCompra(row.id, row.auto_id)
    setDeletingId(null)
    if (error) {
      setPageError(`No se pudo eliminar: ${error.message}`)
      return
    }
    loadCompras()
    loadPendientes()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Panel: pendientes de compra */}
      <div className="rounded-[14px] border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-foreground">Pendientes de compra</h2>
          {pendientes.length > 0 && (
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5">
              {pendientes.length}
            </span>
          )}
        </div>

        {loadingPendientes ? (
          <p className="text-sm text-muted-foreground animate-pulse">Cargando pendientes...</p>
        ) : pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay autos propios pendientes de registrar su compra.
          </p>
        ) : (
          <div className="space-y-2">
            {pendientes.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-background px-3 py-2.5"
              >
                <p className="text-sm min-w-0">
                  <span className="font-mono font-semibold">{a.dominio}</span>{" "}
                  <span className="font-medium text-foreground">
                    {[a.marca, a.modelo].filter(Boolean).join(" ") || "Sin datos"}
                  </span>
                  {a.anio && <span className="text-muted-foreground"> ({a.anio})</span>}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openForm(a.id)}
                  className="shrink-0 h-8 rounded-[8px] text-xs"
                >
                  Registrar compra
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Buscar por dominio..."
              className="pl-9 rounded-[10px]"
            />
          </div>
          <Select
            value={filters.origen || "all"}
            onValueChange={(v) => setFilters((f) => ({ ...f, origen: !v || v === "all" ? "" : v }))}
          >
            <SelectTrigger className="rounded-[10px] w-40">
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los orígenes</SelectItem>
              <SelectItem value="calle">Calle</SelectItem>
              <SelectItem value="permuta">Permuta</SelectItem>
              <SelectItem value="consigna_comprada">Consigna</SelectItem>
            </SelectContent>
          </Select>
          {!loading && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {total} compra{total === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <Button
          onClick={() => openForm()}
          className="rounded-[12px] bg-brand-500 hover:bg-brand-600 text-white h-9 gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrar compra
        </Button>
      </div>

      {pageError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      )}

      {/* Tabla de compras */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch || filters.origen
              ? "No hay compras que coincidan con los filtros."
              : "Todavía no hay compras registradas."}
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Auto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Origen</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Precio compra</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Socios</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">% asignado</th>
                  {canDelete && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const parts = row.participacion_auto
                  const sumPct = parts.reduce((acc, p) => acc + (p.porcentaje ?? 0), 0)
                  const resumen = parts
                    .map((p) => {
                      const nombre = p.socios?.nombre ?? "?"
                      return p.porcentaje != null ? `${nombre} ${new Intl.NumberFormat("es-AR").format(p.porcentaje)}%` : nombre
                    })
                    .join(" · ")

                  return (
                    <tr key={row.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {formatFecha(row.fecha_compra)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-foreground">
                          {row.autos?.dominio ?? "—"}
                        </span>
                        <span className="text-foreground ml-2">
                          {[row.autos?.marca, row.autos?.modelo].filter(Boolean).join(" ")}
                        </span>
                        {row.autos?.anio && (
                          <span className="text-muted-foreground ml-1">({row.autos.anio})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrigenChip origen={row.origen} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground">
                        {row.precio_compra_ars != null && formatPriceARS(row.precio_compra_ars)}
                        {row.precio_compra_ars != null && row.precio_compra_usd != null && " · "}
                        {row.precio_compra_usd != null && formatPriceUSD(row.precio_compra_usd)}
                        {row.precio_compra_ars == null && row.precio_compra_usd == null && "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        {parts.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Sin socios</span>
                        ) : (
                          <>
                            <span className="text-xs font-medium text-foreground">
                              {parts.length} socio{parts.length === 1 ? "" : "s"}
                            </span>
                            <p className="text-xs text-muted-foreground truncate" title={resumen}>
                              {resumen}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {parts.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <PorcentajeChip total={sumPct} />
                        )}
                      </td>
                      {canDelete && (
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                            title="Eliminar compra"
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} · {total} compras
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

      {/* Form */}
      <CompraForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        pendientes={pendientes}
        consignas={consignas}
        socios={socios}
        preselectAutoId={preselectAutoId}
      />
    </div>
  )
}
