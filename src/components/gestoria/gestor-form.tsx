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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveGestor, updateGestor } from "@/lib/gestoria"
import { parsePrice, formatPriceARS, capFirst } from "@/lib/utils"
import type { Gestor } from "@/types/gestoria"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  gestor: Gestor | null // null = nuevo
}

interface FormState {
  nombre: string
  alias: string
  honorario: string
  valor_firma: string
  activo: boolean
  notas: string
}

function buildForm(g: Gestor | null): FormState {
  return {
    nombre: g?.nombre ?? "",
    alias: g?.alias ?? "",
    honorario: g?.honorario?.toString() ?? "",
    valor_firma: g?.valor_firma?.toString() ?? "",
    activo: g?.activo ?? true,
    notas: g?.notas ?? "",
  }
}

export function GestorForm({ open, onClose, onSaved, gestor }: Props) {
  const [form, setForm] = useState<FormState>(() => buildForm(gestor))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(buildForm(gestor))
      setError(null)
    }
  }, [open, gestor])

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
      alias: form.alias.trim() || null,
      honorario: form.honorario.trim() ? parsePrice(form.honorario) : null,
      valor_firma: form.valor_firma.trim() ? parsePrice(form.valor_firma) : null,
      activo: form.activo,
      notas: form.notas.trim() || null,
    }
    const { error: err } = gestor
      ? await updateGestor(gestor.id, payload)
      : await saveGestor(payload)
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
          <DialogTitle>{gestor ? "Editar gestor" : "Nuevo gestor"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => set("nombre")(capFirst(e.target.value))}
                placeholder="Carflow"
                className="rounded-[10px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Alias</Label>
              <Input
                value={form.alias}
                onChange={(e) => set("alias")(capFirst(e.target.value))}
                placeholder="Ari"
                className="rounded-[10px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Honorario</Label>
              <Input
                value={form.honorario}
                onChange={(e) => set("honorario")(e.target.value)}
                placeholder="$ 0"
                className="rounded-[10px]"
              />
              {form.honorario.trim() && (
                <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(form.honorario))}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Valor de firma</Label>
              <Input
                value={form.valor_firma}
                onChange={(e) => set("valor_firma")(e.target.value)}
                placeholder="$ 0"
                className="rounded-[10px]"
              />
              {form.valor_firma.trim() && (
                <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(form.valor_firma))}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Activo</Label>
            <Select
              value={form.activo ? "si" : "no"}
              onValueChange={(v) => set("activo")(v === "si")}
            >
              <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("notas")(capFirst(e.target.value))}
              className="rounded-[10px] resize-none"
              rows={2}
            />
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
            {gestor ? "Guardar cambios" : "Crear gestor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
