"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { fetchConsignaciones, PAGE_SIZE } from "@/lib/consignacion"
import { fetchUsuariosAgencia } from "@/lib/stock"
import { ConsignacionFiltersBar } from "./consignacion-filters"
import { ConsignacionTable } from "./consignacion-table"
import { ConsignacionForm } from "./consignacion-form"
import type { ConsignacionRow, ConsignacionFilters } from "@/types/consignacion"
import type { UsuarioSimple } from "@/types/stock"

const EMPTY_FILTERS: ConsignacionFilters = { search: "", tipoConsigna: "", estadoVerif: "" }

export function ConsignacionPageClient() {
  const { usuario } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<ConsignacionRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<ConsignacionFilters>(EMPTY_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([])
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400)
    return () => clearTimeout(t)
  }, [filters.search])

  const activeFilters: ConsignacionFilters = { ...filters, search: debouncedSearch }

  const load = useCallback(async () => {
    if (!usuario?.agencia_id) return
    setLoading(true)
    setPageError(null)
    const result = await fetchConsignaciones(usuario.agencia_id, activeFilters, page)
    setLoading(false)
    if (result.error) {
      setPageError("No se pudo cargar las consignas. Revisá tu conexión.")
      return
    }
    setRows(result.data ?? [])
    setTotal(result.count ?? 0)
  }, [usuario?.agencia_id, debouncedSearch, filters.tipoConsigna, filters.estadoVerif, page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!usuario?.agencia_id) return
    fetchUsuariosAgencia(usuario.agencia_id).then(setUsuarios)
  }, [usuario?.agencia_id])

  useEffect(() => { setPage(0) }, [filters, debouncedSearch])

  const canCreate =
    usuario?.rol !== "vendedor" && usuario?.rol !== "alistaje"

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSaved(autoId: string) {
    setFormOpen(false)
    router.push(`/consignacion/${autoId}`)
  }

  if (!usuario) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Consignación</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vehículos en consigna</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setFormOpen(true)}
            className="rounded-[12px] bg-brand-500 hover:bg-brand-600 text-white h-9 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nueva consigna
          </Button>
        )}
      </div>

      <ConsignacionFiltersBar
        filters={filters}
        total={total}
        loading={loading}
        onChange={(f) => { setFilters(f) }}
      />

      {pageError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      )}

      <ConsignacionTable rows={rows} loading={loading} />

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages} · {total} consignas
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

      <ConsignacionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        usuarios={usuarios}
      />
    </div>
  )
}
