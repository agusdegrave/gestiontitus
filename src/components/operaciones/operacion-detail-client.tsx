"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Check, AlertCircle, Info } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { fetchVentaById, fetchSeguimientoAuto, updateVenta } from "@/lib/ventas"
import { formatPriceARS, formatDateAR, parsePrice, cn } from "@/lib/utils"
import { EstadoChip } from "@/components/stock/chips"
import { VerifChip, InformeEstadoChip } from "@/components/consignacion/consignacion-chips"
import { EstadoOperacionChip, PagoChip } from "./operacion-chips"
import { CHECKLIST_ENTREGA } from "@/types/ventas"
import type { Venta, EstadoOperacion, ChecklistField } from "@/types/ventas"
import type { Verificacion, Informe } from "@/types/consignacion"

const ROLES_EDITAN = ["administracion", "direccion"]

// Deudas a sumar: campo en ventas → etiqueta (vacío = sin deuda = null)
const DEUDAS_VENDIDO = [
  { field: "deuda_muni", label: "Municipal" },
  { field: "deuda_rentas", label: "Rentas" },
  { field: "deuda_multas", label: "Multas" },
] as const

const DEUDAS_PERMUTA = [
  { field: "deuda_permuta_muni", label: "Municipal" },
  { field: "deuda_permuta_rentas", label: "Rentas" },
  { field: "deuda_permuta_multas", label: "Multas" },
] as const

type DeudaField =
  | (typeof DEUDAS_VENDIDO)[number]["field"]
  | (typeof DEUDAS_PERMUTA)[number]["field"]
  | "gastos_consigna"

interface SeguimientoForm {
  estado_operacion: EstadoOperacion
  fecha_tentativa_entrega: string
  fecha_entrega: string
  costo_transferencia: string
  promesas_alistaje: string
  aclaraciones: string
  checklist: Record<ChecklistField, boolean>
  deudas: Record<DeudaField, string>
}

function buildForm(v: Venta): SeguimientoForm {
  return {
    estado_operacion: v.estado_operacion,
    fecha_tentativa_entrega: v.fecha_tentativa_entrega ?? "",
    fecha_entrega: v.fecha_entrega ?? "",
    costo_transferencia: v.costo_transferencia?.toString() ?? "",
    promesas_alistaje: v.promesas_alistaje ?? "",
    aclaraciones: v.aclaraciones ?? "",
    checklist: Object.fromEntries(
      CHECKLIST_ENTREGA.map((c) => [c.field, v[c.field] === true])
    ) as Record<ChecklistField, boolean>,
    deudas: {
      deuda_muni: v.deuda_muni?.toString() ?? "",
      deuda_rentas: v.deuda_rentas?.toString() ?? "",
      deuda_multas: v.deuda_multas?.toString() ?? "",
      gastos_consigna: v.gastos_consigna?.toString() ?? "",
      deuda_permuta_muni: v.deuda_permuta_muni?.toString() ?? "",
      deuda_permuta_rentas: v.deuda_permuta_rentas?.toString() ?? "",
      deuda_permuta_multas: v.deuda_permuta_multas?.toString() ?? "",
    },
  }
}

// Vacío o no parseable = 0 para el total en vivo
function sumDeudas(values: string[]): number {
  return values.reduce((acc, v) => acc + (v.trim() ? (parsePrice(v) ?? 0) : 0), 0)
}

function SectionCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-stone-50">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-3 bg-stone-50">{footer}</div>}
    </div>
  )
}

function DeudaInput({ label, value, onChange, disabled }: {
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right font-medium">{value}</span>
    </div>
  )
}

export function OperacionDetailClient({ ventaId }: { ventaId: string }) {
  const { usuario } = useAuth()
  const router = useRouter()

  const [venta, setVenta] = useState<Venta | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [verificacion, setVerificacion] = useState<Verificacion | null>(null)
  const [informes, setInformes] = useState<Informe[]>([])

  const [form, setForm] = useState<SeguimientoForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data, error } = await fetchVentaById(ventaId)
    if (error || !data) {
      setLoadError(`No se pudo cargar la operación: ${error?.message ?? "no encontrada"}`)
      setLoading(false)
      return
    }
    setVenta(data)
    setForm(buildForm(data))
    const seg = await fetchSeguimientoAuto(data.auto_id)
    setVerificacion(seg.verificacion)
    setInformes(seg.informes)
    setLoading(false)
  }, [ventaId])

  useEffect(() => { load() }, [load])

  if (!usuario) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError || !venta || !form) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">{loadError ?? "No encontrada."}</p>
        <Button variant="outline" onClick={() => router.push("/operaciones")} className="mt-4 rounded-[10px]">
          Volver
        </Button>
      </div>
    )
  }

  // Editan: administración, dirección o el vendedor que creó la operación (la base lo exige por RLS)
  const canEdit = ROLES_EDITAN.includes(usuario.rol) || venta.vendedor_id === usuario.id

  const auto = venta.autos
  const haContado = (venta.paga_contado ?? 0) > 0
  const haPermuta = (venta.paga_permuta ?? 0) > 0
  const haFinanciado = (venta.paga_financiado ?? 0) > 0

  const checklistDone = CHECKLIST_ENTREGA.filter((c) => form.checklist[c.field]).length
  const checklistTotal = CHECKLIST_ENTREGA.length

  // Deudas a sumar: subtotales y total en vivo (vacío = 0)
  const esConsigna = auto?.tipo === "consigna"
  const hayPermuta = !!venta.auto_entrega_id
  const subtotalVendido = sumDeudas([
    ...DEUDAS_VENDIDO.map((d) => form.deudas[d.field]),
    ...(esConsigna ? [form.deudas.gastos_consigna] : []),
  ])
  const subtotalPermuta = hayPermuta
    ? sumDeudas(DEUDAS_PERMUTA.map((d) => form.deudas[d.field]))
    : 0
  const totalDeudas = subtotalVendido + subtotalPermuta

  function setField<K extends keyof SeguimientoForm>(field: K, value: SeguimientoForm[K]) {
    setForm((p) => (p ? { ...p, [field]: value } : p))
  }

  function toggleChecklist(field: ChecklistField) {
    if (!canEdit) return
    setForm((p) =>
      p ? { ...p, checklist: { ...p.checklist, [field]: !p.checklist[field] } } : p
    )
  }

  function setDeuda(field: DeudaField, value: string) {
    setForm((p) => (p ? { ...p, deudas: { ...p.deudas, [field]: value } } : p))
  }

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    // No mandar agencia_id ni auditoría: los completa la base.
    const { error } = await updateVenta(ventaId, {
      estado_operacion: form.estado_operacion,
      fecha_tentativa_entrega: form.fecha_tentativa_entrega || null,
      fecha_entrega: form.fecha_entrega || null,
      costo_transferencia: form.costo_transferencia ? parsePrice(form.costo_transferencia) : null,
      promesas_alistaje: form.promesas_alistaje.trim() || null,
      aclaraciones: form.aclaraciones.trim() || null,
      ...form.checklist,
      // Deudas: vacío = sin deuda = null (nunca "" ni 0)
      ...Object.fromEntries(
        Object.entries(form.deudas).map(([k, v]) => [k, v.trim() ? parsePrice(v) : null])
      ),
    })
    if (error) {
      setSaving(false)
      setSaveError(error.message)
      return
    }
    // Al pasar a 'entregado' un trigger marca el auto como 'vendido': refrescar para reflejarlo
    await load()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const saveControls = canEdit ? (
    <>
      {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      {saveError && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {saveError}
        </span>
      )}
      {saved && (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <Check className="w-3.5 h-3.5" />
          Cambios guardados
        </span>
      )}
      <Button
        onClick={handleSave}
        disabled={saving}
        size="sm"
        className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8"
      >
        Guardar cambios
      </Button>
    </>
  ) : undefined

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/operaciones")}
          className="rounded-[10px] h-8 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground font-mono">
            {auto?.dominio ?? "—"}
            <span className="font-sans font-normal text-muted-foreground text-base ml-2">
              {auto ? `${auto.marca} ${auto.modelo}${auto.anio ? ` (${auto.anio})` : ""}` : ""}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <EstadoOperacionChip estado={venta.estado_operacion} />
            {auto?.estado && <EstadoChip estado={auto.estado} />}
            {!canEdit && (
              <span className="text-xs text-muted-foreground">Solo lectura</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Datos de la operación (solo lectura) ─────── */}
      <SectionCard title="Datos de la operación">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
          <Row
            label="Auto"
            value={auto ? `${auto.dominio} · ${auto.marca} ${auto.modelo}${auto.anio ? ` ${auto.anio}` : ""}` : "—"}
          />
          <Row
            label="Vendedor"
            value={venta.vendedor ? `${venta.vendedor.nombre} ${venta.vendedor.apellido}` : "—"}
          />
          <Row label="Comprador" value={`${venta.comprador_nombre} ${venta.comprador_apellido}`} />
          <Row label="DNI" value={venta.comprador_dni ?? "—"} />
          <Row label="Teléfono" value={venta.comprador_telefono ?? "—"} />
          <Row
            label="Forma de pago"
            value={
              <span className="inline-flex flex-wrap justify-end gap-1">
                {haContado && <PagoChip label="Contado" color="green" />}
                {haPermuta && <PagoChip label="Permuta" color="purple" />}
                {haFinanciado && <PagoChip label="Financiado" color="blue" />}
                {!haContado && !haPermuta && !haFinanciado && "—"}
              </span>
            }
          />
          <Row label="Precio de venta" value={formatPriceARS(venta.precio_venta)} />
          <Row label="Seña" value={formatPriceARS(venta.senia)} />
          <Row label="Fecha de seña" value={formatDateAR(venta.fecha_senia)} />
          {venta.auto_entrega && (
            <Row
              label="Permuta (entró)"
              value={`${venta.auto_entrega.dominio} · ${venta.auto_entrega.marca} ${venta.auto_entrega.modelo}`}
            />
          )}
        </div>
      </SectionCard>

      {/* ── Estado y entrega (editable) ──────────────── */}
      <SectionCard title="Estado y entrega">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Estado de la operación</Label>
            <Select
              value={form.estado_operacion}
              onValueChange={(v) => setField("estado_operacion", (v ?? "senado") as EstadoOperacion)}
              disabled={!canEdit}
            >
              <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="senado">Señado</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="w-3 h-3 shrink-0" />
              Al marcar Entregado, el auto pasa a Vendido automáticamente.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Costo de transferencia</Label>
            <Input
              value={form.costo_transferencia}
              onChange={(e) => setField("costo_transferencia", e.target.value)}
              disabled={!canEdit}
              placeholder="$ 0"
              className="rounded-[10px]"
            />
            {form.costo_transferencia && (
              <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(form.costo_transferencia))}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Fecha tentativa de entrega</Label>
            <Input
              type="date"
              value={form.fecha_tentativa_entrega}
              onChange={(e) => setField("fecha_tentativa_entrega", e.target.value)}
              disabled={!canEdit}
              className="rounded-[10px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de entrega real</Label>
            <Input
              type="date"
              value={form.fecha_entrega}
              onChange={(e) => setField("fecha_entrega", e.target.value)}
              disabled={!canEdit}
              className="rounded-[10px]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>¿Qué se prometió?</Label>
          <Textarea
            value={form.promesas_alistaje}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField("promesas_alistaje", e.target.value)}
            disabled={!canEdit}
            placeholder="Promesas de alistaje al comprador..."
            className="rounded-[10px] resize-none"
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Aclaraciones</Label>
          <Textarea
            value={form.aclaraciones}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField("aclaraciones", e.target.value)}
            disabled={!canEdit}
            className="rounded-[10px] resize-none"
            rows={3}
          />
        </div>
      </SectionCard>

      {/* ── Deudas a sumar (editable) ────────────────── */}
      <SectionCard title="Deudas a sumar">
        {/* Deudas del auto vendido */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Deudas del auto vendido
            </p>
            {auto && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono font-medium">{auto.dominio}</span> · {auto.marca} {auto.modelo}
              </p>
            )}
          </div>
          <div className={cn("grid grid-cols-1 gap-3", esConsigna ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
            {DEUDAS_VENDIDO.map((d) => (
              <DeudaInput
                key={d.field}
                label={d.label}
                value={form.deudas[d.field]}
                onChange={(v) => setDeuda(d.field, v)}
                disabled={!canEdit}
              />
            ))}
            {esConsigna && (
              <DeudaInput
                label="Gastos de consigna"
                value={form.deudas.gastos_consigna}
                onChange={(v) => setDeuda("gastos_consigna", v)}
                disabled={!canEdit}
              />
            )}
          </div>
        </div>

        {/* Deudas del auto de permuta (solo si entró un usado) */}
        {hayPermuta && (
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Deudas del auto de permuta
              </p>
              {venta.auto_entrega && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-mono font-medium">{venta.auto_entrega.dominio}</span> · {venta.auto_entrega.marca} {venta.auto_entrega.modelo}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEUDAS_PERMUTA.map((d) => (
                <DeudaInput
                  key={d.field}
                  label={d.label}
                  value={form.deudas[d.field]}
                  onChange={(v) => setDeuda(d.field, v)}
                  disabled={!canEdit}
                />
              ))}
            </div>
          </div>
        )}

        {/* Total en vivo */}
        <div className="rounded-[10px] bg-stone-50 border border-border px-4 py-3 space-y-1">
          {hayPermuta && (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal auto vendido</span>
                <span className="tabular-nums">{formatPriceARS(subtotalVendido)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal auto de permuta</span>
                <span className="tabular-nums">{formatPriceARS(subtotalPermuta)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between text-sm font-semibold text-foreground">
            <span>Total deudas a sumar</span>
            <span className="tabular-nums">{formatPriceARS(totalDeudas)}</span>
          </div>
        </div>
      </SectionCard>

      {/* ── Checklist de entrega (editable) ──────────── */}
      <SectionCard title="Checklist de entrega" footer={saveControls}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {checklistDone} / {checklistTotal} completados
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round((checklistDone / checklistTotal) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CHECKLIST_ENTREGA.map((item) => {
            const checked = form.checklist[item.field]
            return (
              <button
                key={item.field}
                type="button"
                onClick={() => toggleChecklist(item.field)}
                disabled={!canEdit}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-sm text-left transition-colors",
                  checked
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-border bg-background text-foreground",
                  canEdit ? "cursor-pointer hover:bg-muted/40" : "cursor-default opacity-80"
                )}
              >
                <span
                  className={cn(
                    "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[6px] border",
                    checked ? "border-green-500 bg-green-500 text-white" : "border-stone-300 bg-white"
                  )}
                >
                  {checked && <Check className="w-3 h-3" />}
                </span>
                {item.label}
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* ── Verificación e informes (solo lectura) ───── */}
      <SectionCard title="Verificación e informes del auto">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verificación</span>
            {verificacion ? <VerifChip estado={verificacion.estado} /> : <span className="text-muted-foreground">—</span>}
          </div>
          {informes.map((inf) => (
            <div key={inf.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {inf.tipo === "dominio" ? "Informe de dominio" : "Informe de multas"}
              </span>
              <InformeEstadoChip tipo={inf.tipo} estado={inf.estado} />
            </div>
          ))}
          {!verificacion && informes.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin datos de verificación ni informes para este auto.</p>
          )}
          <p className="text-xs text-muted-foreground pt-1">
            Se edita desde la ficha del auto en Consignación.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}
