"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, Info } from "lucide-react"
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
import { saveTramite, updateTramite } from "@/lib/gestoria"
import { parsePrice, formatPriceARS, cn } from "@/lib/utils"
import { ESTADO_TRAMITE_LABELS, ESTADOS_CON_COSTO_REAL } from "@/types/gestoria"
import type { Tramite, Gestor, EstadoTramite } from "@/types/gestoria"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  tramite: Tramite | null // null = nuevo
  gestores: Gestor[] // solo activos
  canEdit: boolean
}

interface FormState {
  dominio: string
  vehiculo: string
  gestor_id: string
  estado: EstadoTramite
  fecha_inicio: string
  observaciones: string
  cobrado_cliente: string
  costo_estimado: string
  costo_real: string
  fecha_papeles: string
  deuda_descontada_cliente: string
  deuda_pagada_real: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function buildForm(t: Tramite | null): FormState {
  return {
    dominio: t?.dominio ?? "",
    vehiculo: t?.vehiculo ?? "",
    gestor_id: t?.gestor_id ?? "",
    estado: t?.estado ?? "pendiente",
    fecha_inicio: t?.fecha_inicio ?? todayISO(),
    observaciones: t?.observaciones ?? "",
    cobrado_cliente: t?.cobrado_cliente?.toString() ?? "",
    costo_estimado: t?.costo_estimado?.toString() ?? "",
    costo_real: t?.costo_real?.toString() ?? "",
    fecha_papeles: t?.fecha_papeles ?? "",
    deuda_descontada_cliente: t?.deuda_descontada_cliente?.toString() ?? "",
    deuda_pagada_real: t?.deuda_pagada_real?.toString() ?? "",
  }
}

// Vacío = 0 solo para los previews en vivo (al guardar, vacío = null)
function toMonto(raw: string): number {
  return raw.trim() ? (parsePrice(raw) ?? 0) : 0
}

function MontoInput({ label, value, onChange, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="$ 0"
        className="rounded-[10px]"
      />
      {value.trim() && (
        <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(value))}</p>
      )}
    </div>
  )
}

function GananciaRow({ label, value, estimada }: { label: string; value: number; estimada?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {label}
        {estimada && (
          <span className="inline-flex items-center rounded-[6px] bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            estimado
          </span>
        )}
      </span>
      <span
        className={cn(
          "font-medium tabular-nums",
          value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-foreground"
        )}
      >
        {formatPriceARS(value)}
      </span>
    </div>
  )
}

export function TramiteForm({ open, onClose, onSaved, tramite, gestores, canEdit }: Props) {
  const [form, setForm] = useState<FormState>(() => buildForm(tramite))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(buildForm(tramite))
      setError(null)
    }
  }, [open, tramite])

  function set<K extends keyof FormState>(field: K) {
    return (value: FormState[K]) => setForm((p) => ({ ...p, [field]: value }))
  }

  const disabled = !canEdit || saving

  // Costo real y fecha de papeles: solo con papeles físicos o finalizado
  const conPapeles = ESTADOS_CON_COSTO_REAL.includes(form.estado)
  const hayCostoReal = conPapeles && form.costo_real.trim() !== ""

  // Previews en vivo (las definitivas las calcula la base)
  const costoAplicado = hayCostoReal ? toMonto(form.costo_real) : toMonto(form.costo_estimado)
  const gananciaTransferencia = toMonto(form.cobrado_cliente) - costoAplicado
  const gananciaDeudas = toMonto(form.deuda_descontada_cliente) - toMonto(form.deuda_pagada_real)
  const gananciaTotal = gananciaTransferencia + gananciaDeudas

  async function handleSave() {
    if (!form.dominio.trim()) {
      setError("El dominio es obligatorio.")
      return
    }
    setSaving(true)
    setError(null)
    // NO mandar ganancia_transferencia/ganancia_deudas (las calcula la base),
    // ni agencia_id ni auditoría. Numéricos vacíos = null.
    const payload = {
      dominio: form.dominio.trim().toUpperCase(),
      vehiculo: form.vehiculo.trim() || null,
      gestor_id: form.gestor_id || null,
      estado: form.estado,
      fecha_inicio: form.fecha_inicio || null,
      observaciones: form.observaciones.trim() || null,
      cobrado_cliente: form.cobrado_cliente.trim() ? parsePrice(form.cobrado_cliente) : null,
      costo_estimado: form.costo_estimado.trim() ? parsePrice(form.costo_estimado) : null,
      costo_real: form.costo_real.trim() ? parsePrice(form.costo_real) : null,
      fecha_papeles: form.fecha_papeles || null,
      deuda_descontada_cliente: form.deuda_descontada_cliente.trim()
        ? parsePrice(form.deuda_descontada_cliente)
        : null,
      deuda_pagada_real: form.deuda_pagada_real.trim() ? parsePrice(form.deuda_pagada_real) : null,
    }
    const { error: err } = tramite
      ? await updateTramite(tramite.id, payload)
      : await saveTramite(payload)
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
      <DialogContent className="sm:max-w-xl rounded-[14px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tramite ? (canEdit ? "Editar trámite" : "Detalle del trámite") : "Nuevo trámite"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Identificación ─────────────────────── */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dominio *</Label>
                <Input
                  value={form.dominio}
                  onChange={(e) => set("dominio")(e.target.value.toUpperCase())}
                  disabled={disabled}
                  placeholder="AB123CD"
                  className="rounded-[10px] font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vehículo</Label>
                <Input
                  value={form.vehiculo}
                  onChange={(e) => set("vehiculo")(e.target.value)}
                  disabled={disabled}
                  placeholder="Toyota Corolla 2020"
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Gestor</Label>
                <Select
                  value={form.gestor_id}
                  onValueChange={(v) => set("gestor_id")(v ?? "")}
                  disabled={disabled}
                >
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder="Seleccioná..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gestores.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nombre}{g.alias ? ` (${g.alias})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => set("estado")((v ?? "pendiente") as EstadoTramite)}
                  disabled={disabled}
                >
                  <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_TRAMITE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => set("fecha_inicio")(e.target.value)}
                  disabled={disabled}
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observaciones</Label>
              <Textarea
                value={form.observaciones}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("observaciones")(e.target.value)}
                disabled={disabled}
                className="rounded-[10px] resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* ── Plata de la transferencia ──────────── */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Transferencia
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MontoInput
                label="Cobrado al cliente"
                value={form.cobrado_cliente}
                onChange={set("cobrado_cliente")}
                disabled={disabled}
              />
              <MontoInput
                label="Costo estimado"
                value={form.costo_estimado}
                onChange={set("costo_estimado")}
                disabled={disabled}
              />
            </div>

            {/* Costo real: recién al tener papeles físicos */}
            {conPapeles && (
              <div className="rounded-[10px] border border-brand-200 bg-brand-50/50 p-3 space-y-3">
                {!hayCostoReal && (
                  <p className="flex items-center gap-1.5 text-xs text-brand-700">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Cargá cuánto salió realmente la transferencia.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MontoInput
                    label="Costo real"
                    value={form.costo_real}
                    onChange={set("costo_real")}
                    disabled={disabled}
                  />
                  <div className="space-y-1.5">
                    <Label>Fecha de papeles</Label>
                    <Input
                      type="date"
                      value={form.fecha_papeles}
                      onChange={(e) => set("fecha_papeles")(e.target.value)}
                      disabled={disabled}
                      className="rounded-[10px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Ganancia por deudas ────────────────── */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Deudas (si aplica)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MontoInput
                label="Deuda descontada al cliente"
                value={form.deuda_descontada_cliente}
                onChange={set("deuda_descontada_cliente")}
                disabled={disabled}
              />
              <MontoInput
                label="Deuda pagada real"
                value={form.deuda_pagada_real}
                onChange={set("deuda_pagada_real")}
                disabled={disabled}
              />
            </div>
          </div>

          {/* ── Ganancias (preview en vivo; las guarda la base) ── */}
          <div className="rounded-[10px] bg-stone-50 border border-border px-4 py-3 space-y-1.5">
            <GananciaRow
              label="Ganancia transferencia"
              value={gananciaTransferencia}
              estimada={!hayCostoReal}
            />
            <GananciaRow label="Ganancia por deudas" value={gananciaDeudas} />
            <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-border">
              <span>Ganancia total</span>
              <span
                className={cn(
                  "tabular-nums",
                  gananciaTotal > 0 ? "text-green-600" : gananciaTotal < 0 ? "text-red-600" : "text-foreground"
                )}
              >
                {formatPriceARS(gananciaTotal)}
              </span>
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
            {canEdit ? "Cancelar" : "Cerrar"}
          </Button>
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {tramite ? "Guardar cambios" : "Crear trámite"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
