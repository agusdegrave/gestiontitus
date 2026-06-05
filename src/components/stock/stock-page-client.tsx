"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { fetchAutos, fetchUsuariosAgencia, PAGE_SIZE } from "@/lib/stock"
import { StockFilters } from "./stock-filters"
import { StockTable } from "./stock-table"
import { StockForm } from "./stock-form"
import { DeleteDialog } from "./delete-dialog"
import { VentaForm } from "@/components/ventas/venta-form"
import type { Auto, AutoFilters, UsuarioSimple } from "@/types/stock"

const EMPTY_FILTERS: AutoFilters = { search: "", tipo: "", estado: "", responsable_id: "" }

export function StockPageClient() {
  const { usuario } = useAuth()
  const router = useRouter()

  const [autos, setAutos] = useState<Auto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<AutoFilters>(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [editingAuto, setEditingAuto] = useState<Auto | null>(null)

  const [deleteAuto, setDeleteAuto] = useState<Auto | null>(null)
  const [senandoAuto, setSenandoAuto] = useState<Auto | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const activeFilters = { ...filters, search: debouncedSearch }

  const load = useCallback(async () => {
    if (!usuario?.agencia_id) return
    setLoading(true)
    setPageError(null)
    const { data, count, error } = await fetchAutos(usuario.agencia_id, activeFilters, page)
    setLoading(false)
    if (error) {
      setPageError("No se pudo cargar el stock. Revisá tu conexión.")
      return
    }
    // Supabase devuelve el join como array; normalizamos a objeto único
    const normalized = ((data as unknown[]) ?? []).map((row: unknown) => {
      const a = row as Auto & { responsable: unknown }
      return {
        ...a,
        responsable: Array.isArray(a.responsable) ? (a.responsable[0] ?? null) : a.responsable,
      } as Auto
    })
    setAutos(normalized)
    setTotal(count ?? 0)
  }, [usuario?.agencia_id, debouncedSearch, filters.tipo, filters.estado, filters.responsable_id, page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  // Load usuarios once
  useEffect(() => {
    if (!usuario?.agencia_id) return
    fetchUsuariosAgencia(usuario.agencia_id).then(setUsuarios)
  }, [usuario?.agencia_id])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [filters, debouncedSearch])

  // Permissions
  const canCreate = usuario?.rol !== "vendedor"
  const canEdit = (a: Auto) => {
    if (!usuario || usuario.rol === "vendedor") return false
    if (usuario.rol === "consignatario") return a.responsable_id === usuario.id
    return true
  }
  const canDelete = (a: Auto) => canEdit(a)

  const ROLES_SENAR = ["vendedor", "administracion", "direccion"]
  const canSenar = (a: Auto) => {
    if (!usuario) return false
    if (!ROLES_SENAR.includes(usuario.rol)) return false
    return a.estado !== "senado" && a.estado !== "vendido"
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleFiltersChange(f: AutoFilters) {
    setFilters(f)
  }

  function handleEdit(a: Auto) {
    setEditingAuto(a)
    setFormOpen(true)
  }

  function handleNew() {
    router.push("/vehiculos/nuevo?tipo=propio")
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditingAuto(null)
  }

  function handleSaved() {
    load()
  }

  function handleDeleteRequest(a: Auto) {
    setDeleteAuto(a)
  }

  function handleDeleted() {
    load()
    setDeleteAuto(null)
  }

  function handleSenar(a: Auto) {
    setSenandoAuto(a)
  }

  function handleVentaSaved() {
    load()
  }

  if (!usuario) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vehículos en inventario</p>
        </div>
        {canCreate && (
          <Button
            onClick={handleNew}
            className="rounded-[12px] bg-brand-500 hover:bg-brand-600 text-white h-9 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo auto
          </Button>
        )}
      </div>

      {/* Filters */}
      <StockFilters
        filters={filters}
        usuarios={usuarios}
        total={total}
        loading={loading}
        onChange={handleFiltersChange}
      />

      {/* Error */}
      {pageError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      )}

      {/* Table */}
      <StockTable
        autos={autos}
        loading={loading}
        canEdit={canEdit}
        canDelete={canDelete}
        canSenar={canSenar}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onSenar={handleSenar}
      />

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} · {total} autos
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

      {/* Form sheet */}
      <StockForm
        open={formOpen}
        onClose={handleFormClose}
        onSaved={handleSaved}
        editingAuto={editingAuto}
        usuarios={usuarios}
      />

      {/* Delete dialog */}
      <DeleteDialog
        auto={deleteAuto}
        open={!!deleteAuto}
        onClose={() => setDeleteAuto(null)}
        onDeleted={handleDeleted}
      />

      {/* Venta form */}
      <VentaForm
        open={!!senandoAuto}
        onClose={() => setSenandoAuto(null)}
        onSaved={handleVentaSaved}
        auto={senandoAuto}
        usuarios={usuarios}
      />
    </div>
  )
}
