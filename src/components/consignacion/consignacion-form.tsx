"use client"

import { useState } from "react"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
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
import { formatPriceARS, parsePrice } from "@/lib/utils"
import { createConsignacion } from "@/lib/consignacion"
import type { UsuarioSimple } from "@/types/stock"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (autoId: string) => void
  usuarios: UsuarioSimple[]
}

interface FormState {
  // Auto
  dominio: string
  marca: string
  modelo: string
  version: string
  anio: string
  km: string
  color: string
  combustible: string
  precio_pretendido: string
  precio_publicado: string
  calificacion_precio: string
  responsable_id: string
  // Extra auto fields
  caja: string
  traccion: string
  nro_chasis: string
  nro_motor: string
  ubicacion: string
  estado_general: string
  itv_vence: string
  tiene_gnc: string
  // Consignacion
  tipo: string
  exclusividad: string
  fecha_carga: string
  duenio_nombre: string
  duenio_apellido: string
  duenio_dni: string
  duenio_telefono: string
  duenio_domicilio: string
  observaciones: string
}

const today = new Date().toISOString().split("T")[0]

const EMPTY_FORM: FormState = {
  dominio: "",
  marca: "",
  modelo: "",
  version: "",
  anio: "",
  km: "",
  color: "",
  combustible: "",
  precio_pretendido: "",
  precio_publicado: "",
  calificacion_precio: "",
  responsable_id: "",
  caja: "",
  traccion: "",
  nro_chasis: "",
  nro_motor: "",
  ubicacion: "",
  estado_general: "",
  itv_vence: "",
  tiene_gnc: "no",
  tipo: "fisica",
  exclusividad: "no",
  fecha_carga: today,
  duenio_nombre: "",
  duenio_apellido: "",
  duenio_dni: "",
  duenio_telefono: "",
  duenio_domicilio: "",
  observaciones: "",
}

export function ConsignacionForm({ open, onClose, onSaved, usuarios }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExtra, setShowExtra] = useState(false)

  const set = (field: keyof FormState) => (val: string | null) =>
    setForm((prev) => ({ ...prev, [field]: val ?? "" }))

  const pretendido = parsePrice(form.precio_pretendido)
  const publicado = parsePrice(form.precio_publicado)
  const margen =
    pretendido !== null && publicado !== null ? publicado - pretendido : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.dominio.trim()) {
      setError("El dominio es obligatorio.")
      return
    }
    setSaving(true)
    setError(null)

    const autoPayload = {
      tipo: "consigna" as const,
      estado: "activo" as const,
      eliminado: false,
      dominio: form.dominio.trim().toUpperCase(),
      marca: form.marca.trim() || null,
      modelo: form.modelo.trim() || null,
      version: form.version.trim() || null,
      anio: form.anio ? parseInt(form.anio) : null,
      km: form.km ? parseInt(form.km.replace(/\./g, "")) : null,
      color: form.color.trim() || null,
      combustible: form.combustible || null,
      precio_pretendido: pretendido,
      precio_publicado: publicado,
      margen,
      calificacion_precio: (form.calificacion_precio || null) as "barato" | "bien" | "caro" | null,
      responsable_id: form.responsable_id || null,
      caja: form.caja || null,
      traccion: form.traccion || null,
      nro_chasis: form.nro_chasis.trim() || null,
      nro_motor: form.nro_motor.trim() || null,
      ubicacion: form.ubicacion.trim() || null,
      estado_general: form.estado_general ? parseInt(form.estado_general) : null,
      itv_vence: form.itv_vence || null,
      tiene_gnc: form.tiene_gnc === "si",
    }

    const consignacionPayload = {
      tipo: form.tipo as "fisica" | "virtual",
      exclusividad: form.exclusividad === "si",
      fecha_carga: form.fecha_carga || today,
      duenio_nombre: form.duenio_nombre.trim() || null,
      duenio_apellido: form.duenio_apellido.trim() || null,
      duenio_dni: form.duenio_dni.trim() || null,
      duenio_telefono: form.duenio_telefono.trim() || null,
      duenio_domicilio: form.duenio_domicilio.trim() || null,
      observaciones: form.observaciones.trim() || null,
      responsable_id: form.responsable_id || null,
    }

    const { error: err, autoId } = await createConsignacion(autoPayload, consignacionPayload)
    setSaving(false)

    if (err) {
      console.error("createConsignacion error:", err)
      setError("No se pudo guardar. Revisá los datos e intentá de nuevo.")
      return
    }

    setForm(EMPTY_FORM)
    setShowExtra(false)
    onSaved(autoId!)
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    setShowExtra(false)
    setError(null)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto flex flex-col"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Nueva consigna</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-0 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

            {/* ── Datos del auto ──────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Datos del auto
              </h3>

              {/* Dominio */}
              <div className="space-y-1.5">
                <Label>Dominio <span className="text-destructive">*</span></Label>
                <Input
                  value={form.dominio}
                  onChange={(e) => set("dominio")(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="font-mono uppercase rounded-[10px]"
                />
              </div>

              {/* Marca / Modelo / Versión */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Marca</Label>
                  <Input
                    value={form.marca}
                    onChange={(e) => set("marca")(e.target.value)}
                    placeholder="Toyota"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Modelo</Label>
                  <Input
                    value={form.modelo}
                    onChange={(e) => set("modelo")(e.target.value)}
                    placeholder="Corolla"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Versión</Label>
                  <Input
                    value={form.version}
                    onChange={(e) => set("version")(e.target.value)}
                    placeholder="XEi"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              {/* Año / KM / Color */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Año</Label>
                  <Input
                    type="number"
                    value={form.anio}
                    onChange={(e) => set("anio")(e.target.value)}
                    placeholder="2020"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kilómetros</Label>
                  <Input
                    value={form.km}
                    onChange={(e) => set("km")(e.target.value)}
                    placeholder="80.000"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <Input
                    value={form.color}
                    onChange={(e) => set("color")(e.target.value)}
                    placeholder="Blanco"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              {/* Combustible */}
              <div className="space-y-1.5">
                <Label>Combustible</Label>
                <Select value={form.combustible || "none"} onValueChange={(v) => set("combustible")(v === "none" ? "" : v)}>
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

              {/* Precios */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Precio pretendido</Label>
                  <Input
                    value={form.precio_pretendido}
                    onChange={(e) => set("precio_pretendido")(e.target.value)}
                    placeholder="$ 0"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Precio publicado</Label>
                  <Input
                    value={form.precio_publicado}
                    onChange={(e) => set("precio_publicado")(e.target.value)}
                    placeholder="$ 0"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              {/* Margen (read-only) */}
              {margen !== null && (
                <p className="text-sm text-muted-foreground">
                  Margen:{" "}
                  <span className={margen >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {formatPriceARS(margen)}
                  </span>
                </p>
              )}

              {/* Calificación / Responsable */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Calificación precio</Label>
                  <Select
                    value={form.calificacion_precio || "none"}
                    onValueChange={(v) => set("calificacion_precio")(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="rounded-[10px]">
                      <SelectValue placeholder="Sin calificar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin calificar</SelectItem>
                      <SelectItem value="barato">Barato</SelectItem>
                      <SelectItem value="bien">Bien</SelectItem>
                      <SelectItem value="caro">Caro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {usuarios.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Responsable</Label>
                    <Select
                      value={form.responsable_id || "none"}
                      onValueChange={(v) => set("responsable_id")(v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="rounded-[10px]">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {usuarios.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nombre} {u.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Toggle más datos */}
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
                      <Select value={form.caja || "none"} onValueChange={(v) => set("caja")(v === "none" ? "" : v)}>
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
                      <Select value={form.traccion || "none"} onValueChange={(v) => set("traccion")(v === "none" ? "" : v)}>
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
                      <Input value={form.nro_chasis} onChange={(e) => set("nro_chasis")(e.target.value)} className="rounded-[10px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>N° Motor</Label>
                      <Input value={form.nro_motor} onChange={(e) => set("nro_motor")(e.target.value)} className="rounded-[10px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Ubicación</Label>
                      <Input value={form.ubicacion} onChange={(e) => set("ubicacion")(e.target.value)} className="rounded-[10px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estado general (1-10)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={form.estado_general}
                        onChange={(e) => set("estado_general")(e.target.value)}
                        className="rounded-[10px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>ITV vence</Label>
                      <Input type="date" value={form.itv_vence} onChange={(e) => set("itv_vence")(e.target.value)} className="rounded-[10px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tiene GNC</Label>
                      <Select value={form.tiene_gnc} onValueChange={set("tiene_gnc")}>
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

            {/* Divider */}
            <div className="border-t border-dashed border-stone-200" />

            {/* ── Consignación ────────────────────────── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Consignación
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={set("tipo")}>
                    <SelectTrigger className="rounded-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisica">Física</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Exclusividad</Label>
                  <Select value={form.exclusividad} onValueChange={set("exclusividad")}>
                    <SelectTrigger className="rounded-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="si">Sí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha carga</Label>
                  <Input
                    type="date"
                    value={form.fecha_carga}
                    onChange={(e) => set("fecha_carga")(e.target.value)}
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre del dueño</Label>
                  <Input
                    value={form.duenio_nombre}
                    onChange={(e) => set("duenio_nombre")(e.target.value)}
                    placeholder="Juan"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Apellido del dueño</Label>
                  <Input
                    value={form.duenio_apellido}
                    onChange={(e) => set("duenio_apellido")(e.target.value)}
                    placeholder="Pérez"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>DNI</Label>
                  <Input
                    value={form.duenio_dni}
                    onChange={(e) => set("duenio_dni")(e.target.value)}
                    placeholder="12.345.678"
                    className="rounded-[10px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={form.duenio_telefono}
                    onChange={(e) => set("duenio_telefono")(e.target.value)}
                    placeholder="11 1234-5678"
                    className="rounded-[10px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Domicilio</Label>
                <Input
                  value={form.duenio_domicilio}
                  onChange={(e) => set("duenio_domicilio")(e.target.value)}
                  placeholder="Av. Corrientes 1234, CABA"
                  className="rounded-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <Textarea
                  value={form.observaciones}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("observaciones")(e.target.value)}
                  placeholder="Notas sobre la consigna..."
                  className="rounded-[10px] resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-between gap-3 bg-background">
            {error && (
              <p className="text-sm text-destructive flex-1">{error}</p>
            )}
            {!error && <div className="flex-1" />}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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
                  "Guardar consigna"
                )}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
