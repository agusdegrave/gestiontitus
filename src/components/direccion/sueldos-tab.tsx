"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Plus } from "lucide-react"
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
import { fetchSueldos, insertSueldo } from "@/lib/direccion"
import { fetchUsuariosAgencia } from "@/lib/stock"
import { formatPriceARS, formatPriceUSD, formatDateAR, parsePrice, capFirst } from "@/lib/utils"
import { TIPO_SUELDO_LABELS, nombreEmpleado, type Sueldo, type TipoSueldo } from "@/types/direccion"
import type { UsuarioSimple } from "@/types/stock"

function mesActual(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

// Sentinela para "nombre libre" en el selector de empleado
const LIBRE = "__libre__"

interface FormState {
  empleado: string // id de usuario o LIBRE
  nombre_libre: string
  tipo: TipoSueldo
  monto: string
  moneda: string
  fecha: string
  concepto: string
}

function emptyForm(): FormState {
  return {
    empleado: "",
    nombre_libre: "",
    tipo: "sueldo",
    monto: "",
    moneda: "ARS",
    fecha: new Date().toISOString().slice(0, 10),
    concepto: "",
  }
}

function formatSupabaseError(e: { code?: string; message?: string; details?: unknown; hint?: string }): string {
  return [
    e.code ? `[${e.code}]` : null,
    e.message ?? "error desconocido",
    e.details ? `— ${typeof e.details === "string" ? e.details : JSON.stringify(e.details)}` : null,
    e.hint ? `(hint: ${e.hint})` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

// Sueldos y adelantos de empleados: tabla "sueldos" (RLS por agencia).
export function SueldosTab() {
  const { usuario } = useAuth()
  const [mes, setMes] = useState(mesActual)
  const [sueldos, setSueldos] = useState<Sueldo[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await fetchSueldos(/^\d{4}-\d{2}$/.test(mes) ? mes : "")
    setLoading(false)
    if (err) {
      setError(`Error al cargar sueldos: ${formatSupabaseError(err)}`)
      return
    }
    setError(null)
    setSueldos(data)
  }, [mes])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!usuario?.agencia_id) return
    fetchUsuariosAgencia(usuario.agencia_id).then(setUsuarios)
  }, [usuario?.agencia_id])

  const set = (field: keyof FormState) => (val: string | null) =>
    setForm((prev) => ({ ...prev, [field]: val ?? "" }))

  function openNew() {
    setForm(emptyForm())
    setCreating(true)
    setError(null)
  }

  async function handleSave() {
    const monto = parsePrice(form.monto)
    const esLibre = form.empleado === LIBRE
    if (!form.empleado || (esLibre && !form.nombre_libre.trim())) {
      setError("Seleccioná un empleado o ingresá un nombre libre.")
      return
    }
    if (monto == null) {
      setError("El monto es obligatorio.")
      return
    }
    setSaving(true)
    setError(null)

    // NO mandar agencia_id ni auditoría: los completa el trigger.
    const { error: err } = await insertSueldo({
      usuario_id: esLibre ? null : form.empleado,
      nombre_libre: esLibre ? form.nombre_libre.trim() : null,
      tipo: form.tipo,
      monto,
      moneda: form.moneda,
      fecha: form.fecha,
      concepto: form.concepto.trim() || null,
    })
    setSaving(false)

    if (err) {
      setError(`Error al guardar: ${formatSupabaseError(err)}`)
      return
    }
    setCreating(false)
    load()
  }

  return (
    <div className="space-y-4">
      {/* Selector de mes + alta */}
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mes</p>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="h-9 rounded-[10px] w-44"
          />
        </div>
        {!creating && (
          <Button
            type="button"
            size="sm"
            onClick={openNew}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-9 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar pago
          </Button>
        )}
      </div>

      {/* Form de alta */}
      {creating && (
        <div className="rounded-[12px] border border-border bg-muted/30 p-4 space-y-3 max-w-3xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Nuevo pago
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Empleado *</Label>
              <Select value={form.empleado} onValueChange={set("empleado")}>
                <SelectTrigger className="w-full h-10 rounded-[10px]">
                  <SelectValue placeholder="Seleccioná un empleado..." />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                    </SelectItem>
                  ))}
                  <SelectItem value={LIBRE}>Otro (nombre libre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((prev) => ({ ...prev, tipo: (v as TipoSueldo) ?? "sueldo" }))}
              >
                <SelectTrigger className="w-full h-10 rounded-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_SUELDO_LABELS) as TipoSueldo[]).map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_SUELDO_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.empleado === LIBRE && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nombre libre *</Label>
              <Input
                value={form.nombre_libre}
                onChange={(e) => set("nombre_libre")(capFirst(e.target.value))}
                placeholder="Juan Pérez"
                className="h-10 rounded-[10px]"
              />
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monto *</Label>
              <Input
                value={form.monto}
                onChange={(e) => set("monto")(e.target.value)}
                placeholder="8500000"
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
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => set("fecha")(e.target.value)}
                className="h-10 rounded-[10px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concepto</Label>
            <Input
              value={form.concepto}
              onChange={(e) => set("concepto")(capFirst(e.target.value))}
              placeholder="Sueldo de junio"
              className="h-10 rounded-[10px]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreating(false)}
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar pago"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sueldos.length === 0 ? (
        !error && (
          <div className="rounded-[14px] border border-border bg-white">
            <p className="text-sm text-muted-foreground text-center py-10">
              No hay pagos registrados en este mes.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-[14px] border border-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="px-4 py-3 font-semibold">Empleado</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold text-right">Monto</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Concepto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sueldos.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{nombreEmpleado(s)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-[8px] text-xs font-semibold bg-stone-100 text-stone-600">
                      {TIPO_SUELDO_LABELS[s.tipo] ?? s.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                    {s.moneda === "USD" ? formatPriceUSD(s.monto) : formatPriceARS(s.monto)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDateAR(s.fecha)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.concepto ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
