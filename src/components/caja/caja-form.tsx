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
import { saveCaja, updateCaja } from "@/lib/caja"
import { capFirst } from "@/lib/utils"
import { TIPOS_CAJA } from "@/types/caja"
import type { Caja, TipoCaja, MonedaCaja } from "@/types/caja"
import type { Gestor } from "@/types/gestoria"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  caja: Caja | null // null = nueva
  gestores: Gestor[]
}

interface FormState {
  nombre: string
  tipo: TipoCaja
  moneda: MonedaCaja
  gestor_id: string
}

function buildForm(c: Caja | null): FormState {
  return {
    nombre: c?.nombre ?? "",
    tipo: c?.tipo ?? "efectivo",
    moneda: c?.moneda ?? "ARS",
    gestor_id: c?.gestor_id ?? "",
  }
}

export function CajaForm({ open, onClose, onSaved, caja, gestores }: Props) {
  const [form, setForm] = useState<FormState>(() => buildForm(caja))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(buildForm(caja))
      setError(null)
    }
  }, [open, caja])

  function set<K extends keyof FormState>(field: K) {
    return (value: FormState[K]) => setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.")
      return
    }
    setSaving(true)
    setError(null)
    // NO mandar agencia_id ni auditoría: los completa la base
    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      moneda: form.moneda,
      gestor_id: form.tipo === "gestoria" && form.gestor_id ? form.gestor_id : null,
    }
    const { error: err } = caja
      ? await updateCaja(caja.id, payload)
      : await saveCaja(payload)
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
          <DialogTitle>{caja ? "Editar caja" : "Nueva caja"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => set("nombre")(capFirst(e.target.value))}
              placeholder="Caja fuerte"
              className="rounded-[10px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => set("tipo")((v ?? "efectivo") as TipoCaja)}
              >
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CAJA.map((t) => (
                    <SelectItem key={t.tipo} value={t.tipo}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select
                value={form.moneda}
                onValueChange={(v) => set("moneda")((v ?? "ARS") as MonedaCaja)}
              >
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.tipo === "gestoria" && (
            <div className="space-y-1.5">
              <Label>Gestor (opcional)</Label>
              <Select
                value={form.gestor_id || "none"}
                onValueChange={(v) => set("gestor_id")(v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Sin gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin gestor</SelectItem>
                  {gestores.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}{g.alias ? ` (${g.alias})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            {caja ? "Guardar cambios" : "Crear caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
