"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
import { Separator } from "@/components/ui/separator"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { saveAuto } from "@/lib/stock"
import { parsePrice, formatPriceARS } from "@/lib/utils"
import type { Auto, UsuarioSimple } from "@/types/stock"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editingAuto: Auto | null
  usuarios: UsuarioSimple[]
  usuarioId: string
  agenciaId: string
}

interface FormState {
  tipo: string
  estado: string
  dominio: string
  marca: string
  modelo: string
  version: string
  anio: string
  km: string
  color: string
  responsable_id: string
  precio_compra_ars: string
  precio_compra_usd: string
  precio_pretendido: string
  precio_publicado: string
  precio_info: string
  cotizacion_usd: string
  calificacion_precio: string
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

const EMPTY_FORM: FormState = {
  tipo: "propio",
  estado: "por_ingresar",
  dominio: "",
  marca: "",
  modelo: "",
  version: "",
  anio: "",
  km: "",
  color: "",
  responsable_id: "",
  precio_compra_ars: "",
  precio_compra_usd: "",
  precio_pretendido: "",
  precio_publicado: "",
  precio_info: "",
  cotizacion_usd: "",
  calificacion_precio: "",
  combustible: "",
  caja: "",
  traccion: "",
  nro_chasis: "",
  nro_motor: "",
  ubicacion: "",
  estado_general: "",
  itv_vence: "",
  tiene_gnc: "",
}

function autoToForm(a: Auto): FormState {
  return {
    tipo: a.tipo,
    estado: a.estado,
    dominio: a.dominio,
    marca: a.marca,
    modelo: a.modelo,
    version: a.version ?? "",
    anio: a.anio?.toString() ?? "",
    km: a.km?.toString() ?? "",
    color: a.color ?? "",
    responsable_id: a.responsable_id ?? "",
    precio_compra_ars: a.precio_compra_ars?.toString() ?? "",
    precio_compra_usd: a.precio_compra_usd?.toString() ?? "",
    precio_pretendido: a.precio_pretendido?.toString() ?? "",
    precio_publicado: a.precio_publicado?.toString() ?? "",
    precio_info: a.precio_info?.toString() ?? "",
    cotizacion_usd: a.cotizacion_usd?.toString() ?? "",
    calificacion_precio: a.calificacion_precio ?? "",
    combustible: a.combustible ?? "",
    caja: a.caja ?? "",
    traccion: a.traccion ?? "",
    nro_chasis: a.nro_chasis ?? "",
    nro_motor: a.nro_motor ?? "",
    ubicacion: a.ubicacion ?? "",
    estado_general: a.estado_general?.toString() ?? "",
    itv_vence: a.itv_vence ?? "",
    tiene_gnc: a.tiene_gnc === true ? "si" : a.tiene_gnc === false ? "no" : "",
  }
}

export function StockForm({ open, onClose, onSaved, editingAuto, usuarios, usuarioId, agenciaId }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(editingAuto ? autoToForm(editingAuto) : EMPTY_FORM)
      setError(null)
      setShowMore(false)
    }
  }, [open, editingAuto])

  const set = (field: keyof FormState) => (val: string | null) =>
    setForm((prev) => ({ ...prev, [field]: val ?? "" }))

  const margen = useMemo(() => {
    const pub = parsePrice(form.precio_publicado) ?? 0
    if (!pub) return null
    if (form.tipo === "consigna") {
      const pret = parsePrice(form.precio_pretendido) ?? 0
      return pub - pret
    }
    const compra = parsePrice(form.precio_compra_ars) ?? 0
    return pub - compra
  }, [form.tipo, form.precio_publicado, form.precio_pretendido, form.precio_compra_ars])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tipo || !form.dominio.trim()) {
      setError("Tipo y dominio son obligatorios.")
      return
    }
    setLoading(true)
    setError(null)

    const priceFields = ["precio_compra_ars", "precio_compra_usd", "precio_pretendido", "precio_publicado", "precio_info", "cotizacion_usd"] as const
    const pricesChanged = editingAuto
      ? priceFields.some((f) => parsePrice(form[f]) !== editingAuto[f])
      : true

    const payload: Partial<Auto> = {
      tipo: form.tipo as Auto["tipo"],
      estado: form.estado as Auto["estado"],
      dominio: form.dominio.toUpperCase().trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      version: form.version.trim() || null,
      anio: form.anio ? parseInt(form.anio) : null,
      km: form.km ? parseInt(form.km) : null,
      color: form.color.trim() || null,
      responsable_id: form.responsable_id || null,
      precio_compra_ars: parsePrice(form.precio_compra_ars),
      precio_compra_usd: parsePrice(form.precio_compra_usd),
      precio_pretendido: parsePrice(form.precio_pretendido),
      precio_publicado: parsePrice(form.precio_publicado),
      precio_info: parsePrice(form.precio_info),
      cotizacion_usd: parsePrice(form.cotizacion_usd),
      margen,
      calificacion_precio: (form.calificacion_precio as Auto["calificacion_precio"]) || null,
      combustible: form.combustible || null,
      caja: form.caja || null,
      traccion: form.traccion || null,
      nro_chasis: form.nro_chasis.trim() || null,
      nro_motor: form.nro_motor.trim() || null,
      ubicacion: form.ubicacion.trim() || null,
      estado_general: form.estado_general ? parseInt(form.estado_general) : null,
      itv_vence: form.itv_vence || null,
      tiene_gnc: form.tiene_gnc === "si" ? true : form.tiene_gnc === "no" ? false : null,
      ...(pricesChanged && { ultima_modif_precio: new Date().toISOString() }),
    }

    const { error: err } = await saveAuto(payload, usuarioId, agenciaId, editingAuto?.id)
    setLoading(false)

    if (err) {
      setError(err.message ?? "No se pudo guardar el auto.")
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-xl flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>{editingAuto ? "Editar auto" : "Nuevo auto"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-5">

            {/* Tipo + Estado */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo *">
                <Select value={form.tipo} onValueChange={set("tipo")}>
                  <SelectTrigger className="w-full h-10 rounded-[10px]">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propio">Propio</SelectItem>
                    <SelectItem value="consigna">Consigna</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estado">
                <Select value={form.estado} onValueChange={set("estado")}>
                  <SelectTrigger className="w-full h-10 rounded-[10px]">
                    <SelectValue placeholder="Estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="por_ingresar">Por ingresar</SelectItem>
                    <SelectItem value="en_alistaje">En alistaje</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="senado">Señado</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Dominio */}
            <Field label="Dominio *">
              <Input
                value={form.dominio}
                onChange={(e) => set("dominio")(e.target.value.toUpperCase())}
                placeholder="AB123CD"
                className="h-10 rounded-[10px] uppercase"
                maxLength={10}
              />
            </Field>

            {/* Marca / Modelo */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Marca">
                <Input value={form.marca} onChange={(e) => set("marca")(e.target.value)} placeholder="Toyota" className="h-10 rounded-[10px]" />
              </Field>
              <Field label="Modelo">
                <Input value={form.modelo} onChange={(e) => set("modelo")(e.target.value)} placeholder="Corolla" className="h-10 rounded-[10px]" />
              </Field>
            </div>

            {/* Versión / Año */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Versión">
                <Input value={form.version} onChange={(e) => set("version")(e.target.value)} placeholder="XEI 2.0" className="h-10 rounded-[10px]" />
              </Field>
              <Field label="Año">
                <Input type="number" value={form.anio} onChange={(e) => set("anio")(e.target.value)} placeholder="2022" min={1950} max={2100} className="h-10 rounded-[10px]" />
              </Field>
            </div>

            {/* KM / Color */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kilómetros">
                <Input type="number" value={form.km} onChange={(e) => set("km")(e.target.value)} placeholder="45000" min={0} className="h-10 rounded-[10px]" />
              </Field>
              <Field label="Color">
                <Input value={form.color} onChange={(e) => set("color")(e.target.value)} placeholder="Blanco" className="h-10 rounded-[10px]" />
              </Field>
            </div>

            {/* Responsable */}
            <Field label="Responsable">
              <Select value={form.responsable_id} onValueChange={set("responsable_id")}>
                <SelectTrigger className="w-full h-10 rounded-[10px]">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Separator />

            {/* Precios condicionales */}
            {form.tipo === "consigna" ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio pretendido ($)">
                  <Input value={form.precio_pretendido} onChange={(e) => set("precio_pretendido")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                </Field>
                <Field label="Precio publicado ($)">
                  <Input value={form.precio_publicado} onChange={(e) => set("precio_publicado")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio de compra ($)">
                  <Input value={form.precio_compra_ars} onChange={(e) => set("precio_compra_ars")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                </Field>
                <Field label="Precio publicado ($)">
                  <Input value={form.precio_publicado} onChange={(e) => set("precio_publicado")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                </Field>
              </div>
            )}

            {/* Margen calculado */}
            <div className="rounded-[10px] bg-muted px-3 py-2.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Margen calculado</span>
              <span className={`text-sm font-semibold ${margen !== null ? (margen >= 0 ? "text-green-700" : "text-red-600") : "text-muted-foreground"}`}>
                {margen !== null ? formatPriceARS(margen) : "—"}
              </span>
            </div>

            {/* Calificación precio */}
            <Field label="Calificación precio">
              <Select value={form.calificacion_precio} onValueChange={set("calificacion_precio")}>
                <SelectTrigger className="w-full h-10 rounded-[10px]">
                  <SelectValue placeholder="Sin calificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin calificar</SelectItem>
                  <SelectItem value="barato">Barato</SelectItem>
                  <SelectItem value="bien">Bien</SelectItem>
                  <SelectItem value="caro">Caro</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Más datos toggle */}
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showMore ? "Ocultar datos adicionales" : "Más datos"}
            </button>

            {showMore && (
              <div className="space-y-4 pt-1">
                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Combustible">
                    <Select value={form.combustible} onValueChange={set("combustible")}>
                      <SelectTrigger className="w-full h-10 rounded-[10px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        <SelectItem value="Nafta">Nafta</SelectItem>
                        <SelectItem value="Diésel">Diésel</SelectItem>
                        <SelectItem value="GNC">GNC</SelectItem>
                        <SelectItem value="Nafta/GNC">Nafta/GNC</SelectItem>
                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                        <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Caja">
                    <Select value={form.caja} onValueChange={set("caja")}>
                      <SelectTrigger className="w-full h-10 rounded-[10px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Automática">Automática</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tracción">
                    <Select value={form.traccion} onValueChange={set("traccion")}>
                      <SelectTrigger className="w-full h-10 rounded-[10px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        <SelectItem value="4x2">4x2</SelectItem>
                        <SelectItem value="4x4">4x4</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Estado general (1–10)">
                    <Select value={form.estado_general} onValueChange={set("estado_general")}>
                      <SelectTrigger className="w-full h-10 rounded-[10px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        {Array.from({ length: 10 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nro. chasis">
                    <Input value={form.nro_chasis} onChange={(e) => set("nro_chasis")(e.target.value)} placeholder="..." className="h-10 rounded-[10px]" />
                  </Field>
                  <Field label="Nro. motor">
                    <Input value={form.nro_motor} onChange={(e) => set("nro_motor")(e.target.value)} placeholder="..." className="h-10 rounded-[10px]" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Precio info ($)">
                    <Input value={form.precio_info} onChange={(e) => set("precio_info")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                  </Field>
                  <Field label="Precio compra (USD)">
                    <Input value={form.precio_compra_usd} onChange={(e) => set("precio_compra_usd")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cotización USD">
                    <Input value={form.cotizacion_usd} onChange={(e) => set("cotizacion_usd")(e.target.value)} placeholder="0" className="h-10 rounded-[10px]" />
                  </Field>
                  <Field label="ITV vencimiento">
                    <Input type="date" value={form.itv_vence} onChange={(e) => set("itv_vence")(e.target.value)} className="h-10 rounded-[10px]" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tiene GNC">
                    <Select value={form.tiene_gnc} onValueChange={set("tiene_gnc")}>
                      <SelectTrigger className="w-full h-10 rounded-[10px]">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">—</SelectItem>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Ubicación">
                    <Input value={form.ubicacion} onChange={(e) => set("ubicacion")(e.target.value)} placeholder="Depósito A" className="h-10 rounded-[10px]" />
                  </Field>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
                {error}
              </p>
            )}
          </div>
        </form>

        <SheetFooter className="border-t border-border px-5 py-3 flex-row justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="rounded-[10px]">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-[12px] bg-brand-500 hover:bg-brand-600 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAuto ? "Guardar cambios" : "Crear auto"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  )
}
