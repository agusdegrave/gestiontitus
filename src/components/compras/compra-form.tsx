"use client"

import { useState, useEffect } from "react"
import { Loader2, ChevronDown, ChevronUp, Plus, X, CheckCircle2, AlertTriangle } from "lucide-react"
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
import { cn, formatPriceARS, formatPriceUSD, formatNumber, parsePrice } from "@/lib/utils"
import { saveCompra } from "@/lib/compras"
import { ORIGEN_LABELS } from "@/types/compras"
import type { OrigenCompra, AutoCompra, Socio, ParticipacionInput, MonedaCapital } from "@/types/compras"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  pendientes: AutoCompra[]
  consignas: AutoCompra[]
  socios: Socio[]
  /** Auto preseleccionado desde el panel de pendientes (origen permuta) */
  preselectAutoId?: string | null
}

interface AutoFormState {
  dominio: string
  marca: string
  modelo: string
  version: string
  anio: string
  km: string
  color: string
  combustible: string
  caja: string
  traccion: string
  nro_chasis: string
  nro_motor: string
  ubicacion: string
  estado_general: string
  itv_vence: string
  tiene_gnc: string
}

interface CompraFormState {
  fecha_compra: string
  vendedor_nombre: string
  vendedor_dni: string
  vendedor_telefono: string
  precio_compra_ars: string
  precio_compra_usd: string
  cotizacion_usd: string
  forma_pago: string
  observaciones: string
}

interface ParticipacionRow {
  key: number
  socio_id: string
  capital_aportado: string
  moneda: MonedaCapital
  porcentaje: string
}

const today = () => new Date().toISOString().split("T")[0]

const EMPTY_AUTO: AutoFormState = {
  dominio: "",
  marca: "",
  modelo: "",
  version: "",
  anio: "",
  km: "",
  color: "",
  combustible: "",
  caja: "",
  traccion: "",
  nro_chasis: "",
  nro_motor: "",
  ubicacion: "",
  estado_general: "",
  itv_vence: "",
  tiene_gnc: "no",
}

const EMPTY_COMPRA: CompraFormState = {
  fecha_compra: today(),
  vendedor_nombre: "",
  vendedor_dni: "",
  vendedor_telefono: "",
  precio_compra_ars: "",
  precio_compra_usd: "",
  cotizacion_usd: "",
  forma_pago: "",
  observaciones: "",
}

let rowKey = 0
const newRow = (): ParticipacionRow => ({
  key: ++rowKey,
  socio_id: "",
  capital_aportado: "",
  moneda: "ARS",
  porcentaje: "",
})

const ORIGENES: OrigenCompra[] = ["calle", "permuta", "consigna_comprada"]

const ORIGEN_DESCRIPCION: Record<OrigenCompra, string> = {
  calle: "Auto externo nuevo",
  permuta: "Ya está en Stock, falta su compra",
  consigna_comprada: "Se la compramos al dueño",
}

export function CompraForm({
  open,
  onClose,
  onSaved,
  pendientes,
  consignas,
  socios,
  preselectAutoId,
}: Props) {
  const [origen, setOrigen] = useState<OrigenCompra>("calle")
  const [selectedAutoId, setSelectedAutoId] = useState("")
  const [auto, setAuto] = useState<AutoFormState>(EMPTY_AUTO)
  const [compra, setCompra] = useState<CompraFormState>(EMPTY_COMPRA)
  const [rows, setRows] = useState<ParticipacionRow[]>([newRow()])
  const [showExtra, setShowExtra] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al abrir: resetear, y si viene preseleccionado desde "Pendientes de compra" → permuta
  useEffect(() => {
    if (!open) return
    setAuto(EMPTY_AUTO)
    setCompra({ ...EMPTY_COMPRA, fecha_compra: today() })
    setRows([newRow()])
    setShowExtra(false)
    setError(null)
    if (preselectAutoId) {
      setOrigen("permuta")
      setSelectedAutoId(preselectAutoId)
      const pendiente = pendientes.find((a) => a.id === preselectAutoId)
      if (pendiente?.precio_compra_ars != null) {
        setCompra((prev) => ({
          ...prev,
          precio_compra_ars: new Intl.NumberFormat("es-AR").format(pendiente.precio_compra_ars!),
        }))
      }
    } else {
      setOrigen("calle")
      setSelectedAutoId("")
    }
  }, [open, preselectAutoId]) // eslint-disable-line react-hooks/exhaustive-deps

  const setA = (field: keyof AutoFormState) => (val: string | null) =>
    setAuto((prev) => ({ ...prev, [field]: val ?? "" }))
  const setC = (field: keyof CompraFormState) => (val: string | null) =>
    setCompra((prev) => ({ ...prev, [field]: val ?? "" }))

  const opcionesAuto = origen === "permuta" ? pendientes : origen === "consigna_comprada" ? consignas : []
  const autoSeleccionado = opcionesAuto.find((a) => a.id === selectedAutoId) ?? null
  const sociosActivos = socios.filter((s) => s.activo)

  function handleOrigenChange(nuevo: OrigenCompra) {
    setOrigen(nuevo)
    setSelectedAutoId("")
  }

  function handleSelectAuto(id: string) {
    setSelectedAutoId(id)
    if (origen === "permuta") {
      const elegido = pendientes.find((a) => a.id === id)
      // Prellenar con el precio que ya tenía el auto, si existe
      if (elegido?.precio_compra_ars != null) {
        setCompra((prev) => ({
          ...prev,
          precio_compra_ars: new Intl.NumberFormat("es-AR").format(elegido.precio_compra_ars!),
        }))
      }
    }
  }

  function updateRow(key: number, patch: Partial<ParticipacionRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  // Indicadores en vivo
  const sumPct = rows.reduce((acc, r) => {
    const n = parseFloat(r.porcentaje.replace(",", "."))
    return acc + (isNaN(n) ? 0 : n)
  }, 0)
  const totalARS = rows.reduce((acc, r) => {
    if (r.moneda !== "ARS") return acc
    const n = parsePrice(r.capital_aportado)
    return acc + (n ?? 0)
  }, 0)
  const totalUSD = rows.reduce((acc, r) => {
    if (r.moneda !== "USD") return acc
    const n = parsePrice(r.capital_aportado)
    return acc + (n ?? 0)
  }, 0)
  const pctCompleto = Math.abs(sumPct - 100) < 0.01

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (origen === "calle" && !auto.dominio.trim()) {
      setError("El dominio del auto es obligatorio.")
      return
    }
    if (origen !== "calle" && !selectedAutoId) {
      setError("Seleccioná un auto.")
      return
    }

    setSaving(true)
    setError(null)

    const autoPayload =
      origen === "calle"
        ? {
            dominio: auto.dominio.trim().toUpperCase(),
            marca: auto.marca.trim() || null,
            modelo: auto.modelo.trim() || null,
            version: auto.version.trim() || null,
            anio: auto.anio ? parseInt(auto.anio) : null,
            km: auto.km ? parseInt(auto.km.replace(/\./g, "")) : null,
            color: auto.color.trim() || null,
            combustible: auto.combustible || null,
            caja: auto.caja || null,
            traccion: auto.traccion || null,
            nro_chasis: auto.nro_chasis.trim() || null,
            nro_motor: auto.nro_motor.trim() || null,
            ubicacion: auto.ubicacion.trim() || null,
            estado_general: auto.estado_general ? parseInt(auto.estado_general) : null,
            itv_vence: auto.itv_vence || null,
            tiene_gnc: auto.tiene_gnc === "si",
          }
        : null

    const compraPayload = {
      fecha_compra: compra.fecha_compra || today(),
      vendedor_nombre: compra.vendedor_nombre.trim() || null,
      vendedor_dni: compra.vendedor_dni.trim() || null,
      vendedor_telefono: compra.vendedor_telefono.trim() || null,
      precio_compra_ars: parsePrice(compra.precio_compra_ars),
      precio_compra_usd: parsePrice(compra.precio_compra_usd),
      cotizacion_usd: parsePrice(compra.cotizacion_usd),
      forma_pago: compra.forma_pago.trim() || null,
      observaciones: compra.observaciones.trim() || null,
    }

    const participaciones: ParticipacionInput[] = rows
      .filter((r) => r.socio_id)
      .map((r) => {
        const pct = parseFloat(r.porcentaje.replace(",", "."))
        return {
          socio_id: r.socio_id,
          capital_aportado: parsePrice(r.capital_aportado),
          moneda: r.moneda,
          porcentaje: isNaN(pct) ? null : pct,
        }
      })

    const { error: err } = await saveCompra({
      origen,
      autoId: origen === "calle" ? null : selectedAutoId,
      autoPayload,
      compraPayload,
      participaciones,
    })
    setSaving(false)

    if (err) {
      setError(`No se pudo guardar: ${err.message}`)
      return
    }
    onSaved()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>Registrar compra</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-0 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

            {/* ── Paso 1: Origen ──────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                1 · Origen
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {ORIGENES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => handleOrigenChange(o)}
                    className={cn(
                      "rounded-[12px] border px-3 py-2.5 text-left transition-colors",
                      origen === o
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-border hover:border-stone-300 hover:bg-stone-50"
                    )}
                  >
                    <p className={cn("text-sm font-semibold", origen === o ? "text-brand-700" : "text-foreground")}>
                      {ORIGEN_LABELS[o]}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {ORIGEN_DESCRIPCION[o]}
                    </p>
                  </button>
                ))}
              </div>

              {/* Calle: auto nuevo */}
              {origen === "calle" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Dominio <span className="text-destructive">*</span></Label>
                    <Input
                      value={auto.dominio}
                      onChange={(e) => setA("dominio")(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      className="font-mono uppercase rounded-[10px]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Marca</Label>
                      <Input value={auto.marca} onChange={(e) => setA("marca")(e.target.value)} placeholder="Toyota" className="rounded-[10px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Modelo</Label>
                      <Input value={auto.modelo} onChange={(e) => setA("modelo")(e.target.value)} placeholder="Corolla" className="rounded-[10px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Versión</Label>
                      <Input value={auto.version} onChange={(e) => setA("version")(e.target.value)} placeholder="XEi" className="rounded-[10px]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Año</Label>
                      <Input
                        type="number"
                        value={auto.anio}
                        onChange={(e) => setA("anio")(e.target.value)}
                        placeholder="2020"
                        min={1900}
                        max={new Date().getFullYear() + 1}
                        className="rounded-[10px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kilómetros</Label>
                      <Input value={auto.km} onChange={(e) => setA("km")(e.target.value)} placeholder="80.000" className="rounded-[10px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Color</Label>
                      <Input value={auto.color} onChange={(e) => setA("color")(e.target.value)} placeholder="Blanco" className="rounded-[10px]" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Combustible</Label>
                    <Select value={auto.combustible || "none"} onValueChange={(v) => setA("combustible")(v === "none" ? "" : v)}>
                      <SelectTrigger className="rounded-[10px]">
                        <SelectValue placeholder="Seleccioná" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin especificar</SelectItem>
                        <SelectItem value="nafta">Nafta</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="gnc">GNC</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                        <SelectItem value="electrico">Eléctrico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExtra((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showExtra ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showExtra ? "Ocultar datos adicionales" : "Más datos del auto"}
                  </button>

                  {showExtra && (
                    <div className="space-y-3 border-l-2 border-stone-200 pl-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Caja</Label>
                          <Select value={auto.caja || "none"} onValueChange={(v) => setA("caja")(v === "none" ? "" : v)}>
                            <SelectTrigger className="rounded-[10px]">
                              <SelectValue placeholder="Sin especificar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin especificar</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="automatica">Automática</SelectItem>
                              <SelectItem value="cvt">CVT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Tracción</Label>
                          <Select value={auto.traccion || "none"} onValueChange={(v) => setA("traccion")(v === "none" ? "" : v)}>
                            <SelectTrigger className="rounded-[10px]">
                              <SelectValue placeholder="Sin especificar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin especificar</SelectItem>
                              <SelectItem value="delantera">Delantera</SelectItem>
                              <SelectItem value="trasera">Trasera</SelectItem>
                              <SelectItem value="4x4">4×4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>N° Chasis</Label>
                          <Input value={auto.nro_chasis} onChange={(e) => setA("nro_chasis")(e.target.value)} className="rounded-[10px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>N° Motor</Label>
                          <Input value={auto.nro_motor} onChange={(e) => setA("nro_motor")(e.target.value)} className="rounded-[10px]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Ubicación</Label>
                          <Input value={auto.ubicacion} onChange={(e) => setA("ubicacion")(e.target.value)} className="rounded-[10px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Estado general (1-10)</Label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            value={auto.estado_general}
                            onChange={(e) => setA("estado_general")(e.target.value)}
                            className="rounded-[10px]"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>ITV vence</Label>
                          <Input type="date" value={auto.itv_vence} onChange={(e) => setA("itv_vence")(e.target.value)} className="rounded-[10px]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Tiene GNC</Label>
                          <Select value={auto.tiene_gnc} onValueChange={setA("tiene_gnc")}>
                            <SelectTrigger className="rounded-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="si">Sí</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Permuta / Consigna: selector de auto existente */}
              {origen !== "calle" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>
                      {origen === "permuta" ? "Auto pendiente de compra" : "Auto en consigna"}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    {opcionesAuto.length === 0 ? (
                      <p className="text-sm text-muted-foreground rounded-[10px] border border-dashed border-border px-3 py-2.5">
                        {origen === "permuta"
                          ? "No hay autos propios pendientes de compra."
                          : "No hay autos en consigna activos."}
                      </p>
                    ) : (
                      <Select value={selectedAutoId || "none"} onValueChange={(v) => v && v !== "none" && handleSelectAuto(v)}>
                        <SelectTrigger className="rounded-[10px]">
                          <SelectValue placeholder="Seleccioná un auto" />
                        </SelectTrigger>
                        <SelectContent>
                          {!selectedAutoId && <SelectItem value="none">Seleccioná un auto</SelectItem>}
                          {opcionesAuto.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.dominio} — {[a.marca, a.modelo].filter(Boolean).join(" ") || "Sin datos"}
                              {a.anio ? ` (${a.anio})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {autoSeleccionado && (
                    <div className="rounded-[12px] border border-border bg-stone-50 px-4 py-3 space-y-1">
                      <p className="text-sm">
                        <span className="font-mono font-semibold">{autoSeleccionado.dominio}</span>{" "}
                        <span className="font-medium">
                          {[autoSeleccionado.marca, autoSeleccionado.modelo].filter(Boolean).join(" ")}
                        </span>
                        {autoSeleccionado.anio && (
                          <span className="text-muted-foreground"> ({autoSeleccionado.anio})</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {autoSeleccionado.km != null && <>KM: {formatNumber(autoSeleccionado.km)} · </>}
                        {autoSeleccionado.color && <>Color: {autoSeleccionado.color} · </>}
                        {origen === "permuta" && autoSeleccionado.precio_compra_ars != null && (
                          <>Precio tomado: {formatPriceARS(autoSeleccionado.precio_compra_ars)}</>
                        )}
                        {origen === "consigna_comprada" && autoSeleccionado.precio_pretendido != null && (
                          <>Precio pretendido: {formatPriceARS(autoSeleccionado.precio_pretendido)}</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-200" />

            {/* ── Paso 2: Datos de la compra ──────────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                2 · Datos de la compra
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha de compra</Label>
                  <Input
                    type="date"
                    value={compra.fecha_compra}
                    onChange={(e) => setC("fecha_compra")(e.target.value)}
                    className="rounded-[10px]"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Vendedor (a quién le compramos)</Label>
                  <Input
                    value={compra.vendedor_nombre}
                    onChange={(e) => setC("vendedor_nombre")(e.target.value)}
                    placeholder="Juan Pérez"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>DNI del vendedor</Label>
                  <Input
                    value={compra.vendedor_dni}
                    onChange={(e) => setC("vendedor_dni")(e.target.value)}
                    placeholder="12.345.678"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono del vendedor</Label>
                  <Input
                    value={compra.vendedor_telefono}
                    onChange={(e) => setC("vendedor_telefono")(e.target.value)}
                    placeholder="11 1234-5678"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Precio compra (ARS)</Label>
                  <Input
                    value={compra.precio_compra_ars}
                    onChange={(e) => setC("precio_compra_ars")(e.target.value)}
                    placeholder="$ 0"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Precio compra (USD)</Label>
                  <Input
                    value={compra.precio_compra_usd}
                    onChange={(e) => setC("precio_compra_usd")(e.target.value)}
                    placeholder="USD 0"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cotización USD</Label>
                  <Input
                    value={compra.cotizacion_usd}
                    onChange={(e) => setC("cotizacion_usd")(e.target.value)}
                    placeholder="$ 0"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Forma de pago</Label>
                <Input
                  value={compra.forma_pago}
                  onChange={(e) => setC("forma_pago")(e.target.value)}
                  placeholder="Efectivo, transferencia, mixto..."
                  className="rounded-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea
                  value={compra.observaciones}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setC("observaciones")(e.target.value)}
                  placeholder="Notas sobre la compra..."
                  className="rounded-[10px] resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t border-dashed border-stone-200" />

            {/* ── Paso 3: Socios / participación ──────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                3 · Socios y participación
              </h3>

              {sociosActivos.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-[10px] border border-dashed border-border px-3 py-2.5">
                  No hay socios activos. Cargalos en la pestaña «Socios».
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {rows.map((row) => (
                      <div key={row.key} className="grid grid-cols-[1fr_110px_84px_76px_28px] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Socio</Label>
                          <Select
                            value={row.socio_id || "none"}
                            onValueChange={(v) => updateRow(row.key, { socio_id: !v || v === "none" ? "" : v })}
                          >
                            <SelectTrigger className="rounded-[10px] h-9">
                              <SelectValue placeholder="Elegí" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Elegí un socio</SelectItem>
                              {sociosActivos.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nombre} {s.apellido ?? ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Capital</Label>
                          <Input
                            value={row.capital_aportado}
                            onChange={(e) => updateRow(row.key, { capital_aportado: e.target.value })}
                            placeholder="0"
                            className="rounded-[10px] h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Moneda</Label>
                          <Select
                            value={row.moneda}
                            onValueChange={(v) => updateRow(row.key, { moneda: v as MonedaCapital })}
                          >
                            <SelectTrigger className="rounded-[10px] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ARS">ARS</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">%</Label>
                          <Input
                            value={row.porcentaje}
                            onChange={(e) => updateRow(row.key, { porcentaje: e.target.value })}
                            placeholder="50"
                            className="rounded-[10px] h-9"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          className="inline-flex items-center justify-center w-7 h-9 rounded-[8px] text-muted-foreground hover:text-destructive transition-colors"
                          title="Quitar fila"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRows((prev) => [...prev, newRow()])}
                    className="rounded-[10px] h-8 gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar socio
                  </Button>

                  {/* Indicadores en vivo */}
                  <div className="rounded-[12px] border border-border bg-stone-50 px-4 py-3 space-y-1.5">
                    {pctCompleto ? (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                        <CheckCircle2 className="w-4 h-4" /> 100% asignado
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        Suman {new Intl.NumberFormat("es-AR").format(sumPct)}%
                        {sumPct < 100
                          ? `, faltan ${new Intl.NumberFormat("es-AR").format(100 - sumPct)}%`
                          : `, sobran ${new Intl.NumberFormat("es-AR").format(sumPct - 100)}%`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Capital total: {formatPriceARS(totalARS)}
                      {totalUSD > 0 && <> · {formatPriceUSD(totalUSD)}</>}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between gap-3 bg-background">
            {error ? (
              <p className="text-sm text-destructive flex-1">{error}</p>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
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
                  "Guardar compra"
                )}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
