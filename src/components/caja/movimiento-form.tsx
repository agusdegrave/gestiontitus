"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { saveMovimiento, fetchAutosSimple } from "@/lib/caja"
import { parsePrice, formatPriceARS, formatPriceUSD, capFirst } from "@/lib/utils"
import { CATEGORIAS_SUGERIDAS } from "@/types/caja"
import type { CajaSaldo, TipoMovimiento } from "@/types/caja"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  cajas: CajaSaldo[] // las visibles para el usuario
}

interface FormState {
  caja_id: string
  tipo: TipoMovimiento
  monto: string
  fecha: string
  concepto: string
  categoria: string
  auto_id: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyForm(): FormState {
  return {
    caja_id: "",
    tipo: "ingreso",
    monto: "",
    fecha: todayISO(),
    concepto: "",
    categoria: "",
    auto_id: "",
  }
}

export function MovimientoForm({ open, onClose, onSaved, cajas }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [autos, setAutos] = useState<{ id: string; dominio: string; marca: string; modelo: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setError(null)
      // Lista liviana de autos para asociar (lazy, una vez por apertura)
      fetchAutosSimple().then(setAutos)
    }
  }, [open])

  function set<K extends keyof FormState>(field: K) {
    return (value: FormState[K]) => setForm((p) => ({ ...p, [field]: value }))
  }

  const caja = cajas.find((c) => c.id === form.caja_id) ?? null
  const formatMoneda = caja?.moneda === "USD" ? formatPriceUSD : formatPriceARS

  async function handleSave() {
    const monto = form.monto.trim() ? parsePrice(form.monto) : null
    if (!form.caja_id) {
      setError("Elegí una caja.")
      return
    }
    if (!monto || monto <= 0) {
      setError("El monto debe ser mayor a 0.")
      return
    }
    setSaving(true)
    setError(null)
    // NO mandar agencia_id ni auditoría: los completa la base
    const { error: err } = await saveMovimiento({
      caja_id: form.caja_id,
      tipo: form.tipo,
      monto,
      fecha: form.fecha || todayISO(),
      concepto: form.concepto.trim() || null,
      categoria: form.categoria.trim() || null,
      auto_id: form.auto_id || null,
    })
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Caja *</Label>
              <Select value={form.caja_id} onValueChange={(v) => set("caja_id")(v ?? "")}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Seleccioná..." />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} ({c.moneda})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => set("tipo")((v ?? "ingreso") as TipoMovimiento)}
              >
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto *</Label>
              <Input
                value={form.monto}
                onChange={(e) => set("monto")(e.target.value)}
                placeholder="$ 0"
                className="rounded-[10px]"
              />
              {form.monto.trim() && (
                <p className="text-xs text-muted-foreground">{formatMoneda(parsePrice(form.monto))}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => set("fecha")(e.target.value)}
                className="rounded-[10px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Concepto</Label>
            <Input
              value={form.concepto}
              onChange={(e) => set("concepto")(capFirst(e.target.value))}
              placeholder="Detalle del movimiento..."
              className="rounded-[10px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input
                value={form.categoria}
                onChange={(e) => set("categoria")(capFirst(e.target.value))}
                placeholder="sueldo, taller..."
                list="categorias-sugeridas"
                className="rounded-[10px]"
              />
              <datalist id="categorias-sugeridas">
                {CATEGORIAS_SUGERIDAS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Vehículo (opcional)</Label>
              <Select
                value={form.auto_id || "none"}
                onValueChange={(v) => set("auto_id")(v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Sin vehículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vehículo</SelectItem>
                  {autos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.dominio} · {a.marca} {a.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-[10px]">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
