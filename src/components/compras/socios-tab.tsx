"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, Pencil, Trash2, Search } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { fetchSocios, saveSocio, deleteSocio } from "@/lib/compras"
import { ActivoChip } from "./compras-chips"
import type { Socio } from "@/types/compras"

const ROLES_ELIMINAR = ["direccion"]

interface SocioFormState {
  nombre: string
  apellido: string
  dni: string
  telefono: string
  activo: string
  notas: string
}

const EMPTY_SOCIO: SocioFormState = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  activo: "si",
  notas: "",
}

export function SociosTab() {
  const { usuario } = useAuth()

  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SocioFormState>(EMPTY_SOCIO)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canDelete = usuario ? ROLES_ELIMINAR.includes(usuario.rol) : false

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setPageError(null)
    const { data, error } = await fetchSocios(debouncedSearch)
    setLoading(false)
    if (error) {
      setPageError(`No se pudieron cargar los socios: ${error.message}`)
      return
    }
    setSocios((data as Socio[]) ?? [])
  }, [debouncedSearch])

  useEffect(() => { load() }, [load])

  const set = (field: keyof SocioFormState) => (val: string | null) =>
    setForm((prev) => ({ ...prev, [field]: val ?? "" }))

  function openNew() {
    setEditingId(null)
    setForm(EMPTY_SOCIO)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(socio: Socio) {
    setEditingId(socio.id)
    setForm({
      nombre: socio.nombre,
      apellido: socio.apellido ?? "",
      dni: socio.dni ?? "",
      telefono: socio.telefono ?? "",
      activo: socio.activo ? "si" : "no",
      notas: socio.notas ?? "",
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setFormError("El nombre es obligatorio.")
      return
    }
    setSaving(true)
    setFormError(null)

    const { error } = await saveSocio(
      {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim() || null,
        dni: form.dni.trim() || null,
        telefono: form.telefono.trim() || null,
        activo: form.activo === "si",
        notas: form.notas.trim() || null,
      },
      editingId ?? undefined
    )
    setSaving(false)

    if (error) {
      setFormError(`No se pudo guardar: ${error.message}`)
      return
    }
    setFormOpen(false)
    load()
  }

  async function handleToggleActivo(socio: Socio) {
    setTogglingId(socio.id)
    const { error } = await saveSocio({ activo: !socio.activo }, socio.id)
    setTogglingId(null)
    if (error) {
      setPageError(`No se pudo actualizar: ${error.message}`)
      return
    }
    load()
  }

  async function handleDelete(socio: Socio) {
    if (!confirm(`¿Eliminar al socio ${socio.nombre} ${socio.apellido ?? ""}?`.trim() + " Esta acción no se puede deshacer.")) return
    setDeletingId(socio.id)
    const { error } = await deleteSocio(socio.id)
    setDeletingId(null)
    if (error) {
      setPageError(`No se pudo eliminar: ${error.message}`)
      return
    }
    load()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="pl-9 rounded-[10px]"
          />
        </div>
        <Button
          onClick={openNew}
          className="rounded-[12px] bg-brand-500 hover:bg-brand-600 text-white h-9 gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo socio
        </Button>
      </div>

      {pageError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : socios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch
              ? "No hay socios que coincidan con la búsqueda."
              : "Todavía no hay socios cargados. Creá el primero con «Nuevo socio»."}
          </p>
        </div>
      ) : (
        <div className="rounded-[14px] border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-stone-50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Apellido</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Teléfono</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Estado</th>
                  <th className="w-32" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {socios.map((socio) => (
                  <tr key={socio.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      {socio.nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">
                      {socio.apellido || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">
                      {socio.telefono || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ActivoChip activo={socio.activo} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(socio)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-stone-100 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActivo(socio)}
                          disabled={togglingId === socio.id}
                          className="inline-flex items-center justify-center h-7 px-2 rounded-[8px] text-xs text-muted-foreground hover:text-foreground hover:bg-stone-100 transition-colors whitespace-nowrap"
                          title={socio.activo ? "Desactivar" : "Activar"}
                        >
                          {togglingId === socio.id
                            ? "..."
                            : socio.activo
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(socio)}
                            disabled={deletingId === socio.id}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-[8px] text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            {deletingId === socio.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form */}
      <Sheet open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle>{editingId ? "Editar socio" : "Nuevo socio"}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-0 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => set("nombre")(e.target.value)}
                  placeholder="Juan"
                  className="rounded-[10px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido</Label>
                <Input
                  value={form.apellido}
                  onChange={(e) => set("apellido")(e.target.value)}
                  placeholder="Pérez"
                  className="rounded-[10px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>DNI</Label>
                  <Input
                    value={form.dni}
                    onChange={(e) => set("dni")(e.target.value)}
                    placeholder="12.345.678"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.telefono}
                    onChange={(e) => set("telefono")(e.target.value)}
                    placeholder="11 1234-5678"
                    className="rounded-[10px]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Activo</Label>
                <Select value={form.activo} onValueChange={set("activo")}>
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notas</Label>
                <Textarea
                  value={form.notas}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("notas")(e.target.value)}
                  placeholder="Notas sobre el socio..."
                  className="rounded-[10px] resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between gap-3 bg-background">
              {formError ? (
                <p className="text-sm text-destructive flex-1">{formError}</p>
              ) : (
                <div className="flex-1" />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="rounded-[10px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Guardando...</>
                  ) : (
                    "Guardar socio"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
