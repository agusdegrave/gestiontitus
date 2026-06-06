"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { fetchGestores, deleteGestor } from "@/lib/gestoria"
import { formatPriceARS, cn } from "@/lib/utils"
import { GestorForm } from "./gestor-form"
import type { Gestor } from "@/types/gestoria"

const ROLES_EDITAN = ["administracion", "direccion"]

export function GestoresTab() {
  const { usuario } = useAuth()

  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Gestor | null>(null)

  const [deleting, setDeleting] = useState<Gestor | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canEdit = usuario ? ROLES_EDITAN.includes(usuario.rol) : false
  const canDelete = usuario?.rol === "direccion"

  const load = useCallback(async () => {
    const { data, error } = await fetchGestores()
    if (error) setLoadError(`No se pudieron cargar los gestores: ${error.message}`)
    setGestores(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError(null)
    const { error } = await deleteGestor(deleting.id)
    setDeleteLoading(false)
    if (error) {
      setDeleteError(error.message)
      return
    }
    setDeleting(null)
    load()
  }

  const filtered = gestores.filter((g) =>
    g.nombre.toLowerCase().includes(search.trim().toLowerCase()) ||
    (g.alias ?? "").toLowerCase().includes(search.trim().toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Buscador + nuevo */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar gestor..."
            className="pl-8 rounded-[10px]"
          />
        </div>
        {canEdit && (
          <Button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo gestor
          </Button>
        )}
      </div>

      {loadError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <p className="text-base font-medium text-foreground">Sin gestores</p>
          <p className="text-sm text-muted-foreground">
            {search.trim() ? "No hay gestores que coincidan con la búsqueda." : "Todavía no hay gestores cargados."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-warm-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>Nombre</Th>
                <Th>Alias</Th>
                <Th className="text-right">Honorario</Th>
                <Th className="text-right">Valor de firma</Th>
                <Th>Activo</Th>
                {canEdit && <Th className="w-20" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr
                  key={g.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors hover:bg-muted/30",
                    i % 2 === 0 ? "" : "bg-muted/10"
                  )}
                >
                  <Td className="font-medium text-foreground">{g.nombre}</Td>
                  <Td className="text-muted-foreground">{g.alias ?? "—"}</Td>
                  <Td className="text-right tabular-nums">{formatPriceARS(g.honorario)}</Td>
                  <Td className="text-right tabular-nums">{formatPriceARS(g.valor_firma)}</Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
                        g.activo ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600"
                      )}
                    >
                      {g.activo ? "Sí" : "No"}
                    </span>
                  </Td>
                  {canEdit && (
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(g); setFormOpen(true) }}
                          className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => { setDeleteError(null); setDeleting(g) }}
                            className="p-1.5 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form crear/editar */}
      <GestorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        gestor={editing}
      />

      {/* Confirmación de eliminado (solo dirección) */}
      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar gestor</DialogTitle>
            <DialogDescription>
              ¿Confirmás que querés eliminar{" "}
              <span className="font-semibold text-foreground">{deleting?.nombre}</span>?
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
