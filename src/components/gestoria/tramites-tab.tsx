"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  fetchTramites,
  fetchTramitesTotales,
  fetchGestores,
  deleteTramite,
  TRAMITES_PAGE_SIZE,
} from "@/lib/gestoria"
import { formatPriceARS, cn } from "@/lib/utils"
import { ESTADO_TRAMITE_LABELS } from "@/types/gestoria"
import { TramiteForm } from "./tramite-form"
import type { Tramite, TramiteFilters, Gestor, EstadoTramite } from "@/types/gestoria"

const ROLES_EDITAN = ["administracion", "direccion"]

const EMPTY_FILTERS: TramiteFilters = { search: "", gestor_id: "", estado: "" }

const ESTADO_TRAMITE_STYLES: Record<EstadoTramite, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  en_proceso: "bg-blue-100 text-blue-700",
  papeles_fisicos: "bg-orange-100 text-orange-700",
  finalizado: "bg-green-100 text-green-700",
}

function EstadoTramiteChip({ estado }: { estado: EstadoTramite }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        ESTADO_TRAMITE_STYLES[estado] ?? "bg-stone-100 text-stone-600"
      )}
    >
      {ESTADO_TRAMITE_LABELS[estado] ?? estado}
    </span>
  )
}

function GananciaCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-foreground"
      )}
    >
      {formatPriceARS(value)}
    </span>
  )
}

function ResumenCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums mt-0.5",
          value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-foreground"
        )}
      >
        {formatPriceARS(value)}
      </p>
    </div>
  )
}

export function TramitesTab() {
  const { usuario } = useAuth()

  const [tramites, setTramites] = useState<Tramite[]>([])
  const [total, setTotal] = useState(0)
  const [totales, setTotales] = useState({ transferencia: 0, deudas: 0 })
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [filters, setFilters] = useState<TramiteFilters>(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Tramite | null>(null)

  const [deleting, setDeleting] = useState<Tramite | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canEdit = usuario ? ROLES_EDITAN.includes(usuario.rol) : false
  const canDelete = usuario?.rol === "direccion"

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const activeFilters: TramiteFilters = { ...filters, search: debouncedSearch }

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setLoadError(null)
    const [result, sums] = await Promise.all([
      fetchTramites(activeFilters, page),
      fetchTramitesTotales(activeFilters),
    ])
    setLoading(false)
    if (result.error) {
      setLoadError(`No se pudieron cargar los trámites: ${result.error.message}`)
      return
    }
    setTramites((result.data as unknown as Tramite[]) ?? [])
    setTotal(result.count ?? 0)
    setTotales(sums)
  }, [debouncedSearch, filters.gestor_id, filters.estado, page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [filters.gestor_id, filters.estado, debouncedSearch])

  useEffect(() => {
    fetchGestores().then(({ data }) => setGestores(data))
  }, [])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError(null)
    const { error } = await deleteTramite(deleting.id)
    setDeleteLoading(false)
    if (error) {
      setDeleteError(error.message)
      return
    }
    setDeleting(null)
    load()
  }

  const gestoresActivos = gestores.filter((g) => g.activo)
  const totalPages = Math.ceil(total / TRAMITES_PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Resumen del filtro actual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ResumenCard label="Ganancia transferencia" value={totales.transferencia} />
        <ResumenCard label="Ganancia por deudas" value={totales.deudas} />
        <ResumenCard label="Ganancia total" value={totales.transferencia + totales.deudas} />
      </div>

      {/* Filtros + nuevo */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar dominio o vehículo..."
            className="pl-8 rounded-[10px]"
          />
        </div>
        <Select
          value={filters.gestor_id || "all"}
          onValueChange={(v) => setFilters((p) => ({ ...p, gestor_id: v === "all" ? "" : (v ?? "") }))}
        >
          <SelectTrigger className="rounded-[10px] w-[170px]">
            <SelectValue placeholder="Gestor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los gestores</SelectItem>
            {gestores.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.estado || "all"}
          onValueChange={(v) => setFilters((p) => ({ ...p, estado: v === "all" ? "" : (v ?? "") }))}
        >
          <SelectTrigger className="rounded-[10px] w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(ESTADO_TRAMITE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground tabular-nums">
          {loading ? "..." : `${total} trámite${total === 1 ? "" : "s"}`}
        </span>
        <div className="flex-1" />
        {canEdit && (
          <Button
            onClick={() => { setSelected(null); setFormOpen(true) }}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo trámite
          </Button>
        )}
      </div>

      {loadError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Grilla */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : tramites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-base font-medium text-foreground">Sin trámites</p>
          <p className="text-sm text-muted-foreground">
            No hay trámites que coincidan con los filtros.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-warm-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>Dominio</Th>
                <Th>Vehículo</Th>
                <Th>Gestor</Th>
                <Th>Estado</Th>
                <Th className="text-right">Cobrado</Th>
                <Th className="text-right">Costo</Th>
                <Th className="text-right">G. transferencia</Th>
                <Th className="text-right">G. deudas</Th>
                <Th className="text-right">G. total</Th>
                {canDelete && <Th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {tramites.map((t, i) => {
                const esEstimado = t.costo_real == null
                const costo = t.costo_real ?? t.costo_estimado
                const gTotal =
                  t.ganancia_transferencia != null || t.ganancia_deudas != null
                    ? (t.ganancia_transferencia ?? 0) + (t.ganancia_deudas ?? 0)
                    : null
                return (
                  <tr
                    key={t.id}
                    onClick={() => { setSelected(t); setFormOpen(true) }}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors hover:bg-muted/30 cursor-pointer",
                      i % 2 === 0 ? "" : "bg-muted/10"
                    )}
                  >
                    <Td className="font-mono font-semibold text-[13px] tracking-wider">
                      {t.dominio}
                    </Td>
                    <Td className="text-muted-foreground">{t.vehiculo ?? "—"}</Td>
                    <Td className="text-muted-foreground">
                      {t.gestores
                        ? `${t.gestores.nombre}${t.gestores.alias ? ` (${t.gestores.alias})` : ""}`
                        : "—"}
                    </Td>
                    <Td><EstadoTramiteChip estado={t.estado} /></Td>
                    <Td className="text-right tabular-nums">{formatPriceARS(t.cobrado_cliente)}</Td>
                    <Td className="text-right tabular-nums">
                      {costo != null ? (
                        <>
                          {formatPriceARS(costo)}
                          {esEstimado && (
                            <span className="text-xs text-muted-foreground ml-1">(est.)</span>
                          )}
                        </>
                      ) : "—"}
                    </Td>
                    <Td className="text-right"><GananciaCell value={t.ganancia_transferencia} /></Td>
                    <Td className="text-right"><GananciaCell value={t.ganancia_deudas} /></Td>
                    <Td className="text-right"><GananciaCell value={gTotal} /></Td>
                    {canDelete && (
                      <Td>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteError(null); setDeleting(t) }}
                          className="p-1.5 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Td>
                    )}
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
            Página {page + 1} de {totalPages} · {total} trámites
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

      {/* Form nuevo/editar/detalle */}
      <TramiteForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => load({ silent: true })}
        tramite={selected}
        gestores={gestoresActivos}
        canEdit={canEdit}
      />

      {/* Confirmación de eliminado (solo dirección) */}
      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar trámite</DialogTitle>
            <DialogDescription>
              ¿Confirmás que querés eliminar el trámite de{" "}
              <span className="font-semibold text-foreground font-mono">{deleting?.dominio}</span>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive/90 hover:bg-destructive text-white"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
