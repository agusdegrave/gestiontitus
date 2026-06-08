"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { fetchGastosAuto, insertGastoAuto, updateGastoAuto, deleteGastoAuto } from "@/lib/gastos"
import { formatPriceARS, formatPriceUSD, formatDateAR, parsePrice, capFirst } from "@/lib/utils"
import { CATEGORIAS_GASTO, totalesGastos, type GastoAuto } from "@/types/gastos"

interface FormState {
  fecha: string
  concepto: string
  categoria: string
  monto: string
  moneda: string
}

function emptyForm(): FormState {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    concepto: "",
    categoria: "",
    monto: "",
    moneda: "ARS",
  }
}

// Sección "Gastos del vehículo": CRUD sobre gastos_auto.
// Crear: administracion/direccion/alistaje. Editar/borrar: administracion/direccion.
export function GastosAutoSection({ autoId }: { autoId: string }) {
  const { usuario } = useAuth()
  const [gastos, setGastos] = useState<GastoAuto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // null = cerrado, "new" = alta, id = edición
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const puedeCrear =
    usuario?.rol === "administracion" ||
    usuario?.rol === "direccion" ||
    usuario?.rol === "alistaje"
  const puedeEditar = usuario?.rol === "administracion" || usuario?.rol === "direccion"

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await fetchGastosAuto(autoId)
    setLoading(false)
    if (err) {
      setError(`Error al cargar gastos: ${err.message}`)
      return
    }
    setError(null)
    setGastos(data)
  }, [autoId])

  useEffect(() => {
    load()
  }, [load])

  const set = (field: keyof FormState) => (val: string | null) =>
    setForm((prev) => ({ ...prev, [field]: val ?? "" }))

  function openNew() {
    setForm(emptyForm())
    setEditing("new")
    setError(null)
  }

  function openEdit(g: GastoAuto) {
    setForm({
      fecha: g.fecha,
      concepto: g.concepto,
      categoria: g.categoria ?? "",
      monto: g.monto.toString(),
      moneda: g.moneda,
    })
    setEditing(g.id)
    setError(null)
  }

  async function handleSave() {
    const monto = parsePrice(form.monto)
    if (!form.concepto.trim() || monto == null) {
      setError("Concepto y monto son obligatorios.")
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      fecha: form.fecha,
      concepto: form.concepto.trim(),
      categoria: form.categoria || null,
      monto,
      moneda: form.moneda,
    }

    const { error: err } =
      editing === "new"
        ? await insertGastoAuto({ ...payload, auto_id: autoId })
        : await updateGastoAuto(editing!, payload)
    setSaving(false)

    if (err) {
      setError(`Error al guardar: ${err.message}`)
      return
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const { error: err } = await deleteGastoAuto(id)
    setDeletingId(null)
    if (err) {
      setError(`Error al eliminar: ${err.message}`)
      return
    }
    setGastos((prev) => prev.filter((g) => g.id !== id))
  }

  const totales = totalesGastos(gastos)

  return (
    <div className="rounded-[14px] border border-border bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-stone-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Gastos del vehículo</h2>
          {!loading && gastos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{formatPriceARS(totales.ars)}</span>
              {totales.usd > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold text-foreground">{formatPriceUSD(totales.usd)}</span>
                </>
              )}
            </span>
          )}
        </div>
        {puedeCrear && editing === null && (
          <Button
            type="button"
            size="sm"
            onClick={openNew}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar gasto
          </Button>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : gastos.length === 0 && editing === null ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin gastos registrados.
          </p>
        ) : (
          gastos.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="pb-2 font-semibold">Fecha</th>
                  <th className="pb-2 font-semibold">Concepto</th>
                  <th className="pb-2 font-semibold">Categoría</th>
                  <th className="pb-2 font-semibold text-right">Monto</th>
                  {puedeEditar && <th className="pb-2 w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {gastos.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2 text-muted-foreground whitespace-nowrap">{formatDateAR(g.fecha)}</td>
                    <td className="py-2 text-foreground">{g.concepto}</td>
                    <td className="py-2 text-muted-foreground">{g.categoria ?? "—"}</td>
                    <td className="py-2 text-right font-medium text-foreground whitespace-nowrap">
                      {g.moneda === "USD" ? formatPriceUSD(g.monto) : formatPriceARS(g.monto)}
                    </td>
                    {puedeEditar && (
                      <td className="py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(g)}
                            aria-label="Editar gasto"
                            className="p-1.5 rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(g.id)}
                            disabled={deletingId === g.id}
                            aria-label="Eliminar gasto"
                            className="p-1.5 rounded-[8px] text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            {deletingId === g.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* Form de alta / edición */}
        {editing !== null && (
          <div className="rounded-[12px] border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {editing === "new" ? "Nuevo gasto" : "Editar gasto"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fecha</Label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => set("fecha")(e.target.value)}
                  className="h-10 rounded-[10px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoría</Label>
                <Select value={form.categoria} onValueChange={set("categoria")}>
                  <SelectTrigger className="w-full h-10 rounded-[10px]">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {CATEGORIAS_GASTO.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concepto *</Label>
              <Input
                value={form.concepto}
                onChange={(e) => set("concepto")(capFirst(e.target.value))}
                placeholder="Cambio de embrague"
                className="h-10 rounded-[10px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monto *</Label>
                <Input
                  value={form.monto}
                  onChange={(e) => set("monto")(e.target.value)}
                  placeholder="150000"
                  className="h-10 rounded-[10px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Moneda</Label>
                <Select value={form.moneda} onValueChange={set("moneda")}>
                  <SelectTrigger className="w-full h-10 rounded-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-[10px] h-8"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar gasto"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
