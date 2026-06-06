"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { fetchVentas, fetchTareas, completarTarea, normalizeVenta, PAGE_SIZE } from "@/lib/ventas"
import { OperacionesFilters } from "./operaciones-filters"
import { OperacionesTable } from "./operaciones-table"
import type { Venta, Tarea, VentaFilters } from "@/types/ventas"

const EMPTY_FILTERS: VentaFilters = { search: "", estado_operacion: "" }

const ROLES_TAREAS = ["administracion", "direccion"]

export function OperacionesPageClient() {
  const { usuario } = useAuth()
  const router = useRouter()

  const [ventas, setVentas] = useState<Venta[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<VentaFilters>(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loadingTareas, setLoadingTareas] = useState(false)
  const [completandoId, setCompletandoId] = useState<string | null>(null)

  const canVerTareas = usuario ? ROLES_TAREAS.includes(usuario.rol) : false

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const activeFilters = { ...filters, search: debouncedSearch }

  const loadVentas = useCallback(async () => {
    setLoading(true)
    setPageError(null)
    const result = await fetchVentas(activeFilters, page)
    setLoading(false)
    if (result.error) {
      const e = result.error as { code?: string; message?: string; details?: string; hint?: string }
      console.error("Error al cargar ventas (Supabase):", e)
      const partes = [
        e.code ? `[${e.code}]` : null,
        e.message ?? "error desconocido",
        e.details ? `— ${typeof e.details === "string" ? e.details : JSON.stringify(e.details)}` : null,
        e.hint ? `(hint: ${e.hint})` : null,
      ].filter(Boolean)
      setPageError(`No se pudieron cargar las operaciones: ${partes.join(" ")}`)
      return
    }
    const normalized = ((result.data as unknown[]) ?? []).map(normalizeVenta)
    setVentas(normalized)
    setTotal(result.count ?? 0)
  }, [debouncedSearch, filters.estado_operacion, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTareas = useCallback(async () => {
    if (!canVerTareas) return
    setLoadingTareas(true)
    const data = await fetchTareas()
    setLoadingTareas(false)
    setTareas(data)
  }, [canVerTareas])

  useEffect(() => { loadVentas() }, [loadVentas])
  useEffect(() => { loadTareas() }, [loadTareas])
  useEffect(() => { setPage(0) }, [filters, debouncedSearch])

  async function handleCompletarTarea(id: string) {
    setCompletandoId(id)
    await completarTarea(id)
    setCompletandoId(null)
    loadTareas()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (!usuario) return null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Operaciones</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Historial de ventas y señas</p>
      </div>

      {/* Tareas pendientes */}
      {canVerTareas && (
        <div className="rounded-[14px] border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-foreground">Tareas pendientes</h2>
            {tareas.length > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5">
                {tareas.length}
              </span>
            )}
          </div>

          {loadingTareas ? (
            <p className="text-sm text-muted-foreground animate-pulse">Cargando tareas...</p>
          ) : tareas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay tareas pendientes.</p>
          ) : (
            <div className="space-y-2">
              {tareas.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3 rounded-[10px] border border-border bg-background px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.titulo}</p>
                    {t.descripcion && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t.descripcion}</p>
                    )}
                    {t.autos && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Auto:{" "}
                        <span className="font-mono font-medium">
                          {Array.isArray(t.autos) ? (t.autos[0] as { dominio: string })?.dominio : (t.autos as { dominio: string })?.dominio}
                        </span>{" "}
                        {Array.isArray(t.autos)
                          ? `${(t.autos[0] as { marca: string; modelo: string })?.marca} ${(t.autos[0] as { marca: string; modelo: string })?.modelo}`
                          : `${(t.autos as { marca: string; modelo: string })?.marca} ${(t.autos as { marca: string; modelo: string })?.modelo}`}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCompletarTarea(t.id)}
                    disabled={completandoId === t.id}
                    className="shrink-0 h-8 rounded-[8px] text-xs"
                  >
                    {completandoId === t.id ? "..." : "Marcar hecha"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <OperacionesFilters
        filters={filters}
        total={total}
        loading={loading}
        onChange={(f) => setFilters(f)}
      />

      {/* Error */}
      {pageError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      )}

      {/* Table */}
      <OperacionesTable
        ventas={ventas}
        loading={loading}
        onView={(v: Venta) => router.push(`/operaciones/${v.id}`)}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} · {total} operaciones
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
