"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2 } from "lucide-react"
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
import { saveVenta } from "@/lib/ventas"
import { parsePrice, formatPriceARS, capFirst } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { FINANCIERAS } from "@/types/ventas"
import type { Auto, UsuarioSimple } from "@/types/stock"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  auto: Auto | null
  usuarios: UsuarioSimple[]
}

interface PermutaState {
  dominio: string
  marca: string
  modelo: string
  version: string
  anio: string
  km: string
  color: string
  combustible: string
  precio_toma: string
}

interface FormState {
  fecha_senia: string
  senia: string
  lugar_senia: string
  vendedor_id: string
  procedencia: string
  precio_venta: string
  paga_contado: string
  paga_permuta: string
  paga_financiado: string
  financiera: string
  cantidad_cuotas: string
  costo_prenda: string
  comprador_nombre: string
  comprador_apellido: string
  comprador_dni: string
  comprador_domicilio: string
  comprador_telefono: string
  tiene_permuta: boolean
  permuta: PermutaState
}

const EMPTY_PERMUTA: PermutaState = {
  dominio: "",
  marca: "",
  modelo: "",
  version: "",
  anio: "",
  km: "",
  color: "",
  combustible: "",
  precio_toma: "",
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function makeEmptyForm(usuarioId: string): FormState {
  return {
    fecha_senia: todayISO(),
    senia: "",
    lugar_senia: "",
    vendedor_id: usuarioId,
    procedencia: "",
    precio_venta: "",
    paga_contado: "",
    paga_permuta: "",
    paga_financiado: "",
    financiera: "",
    cantidad_cuotas: "",
    costo_prenda: "",
    comprador_nombre: "",
    comprador_apellido: "",
    comprador_dni: "",
    comprador_domicilio: "",
    comprador_telefono: "",
    tiene_permuta: false,
    permuta: { ...EMPTY_PERMUTA },
  }
}

export function VentaForm({ open, onClose, onSaved, auto, usuarios }: Props) {
  const { usuario } = useAuth()
  const [form, setForm] = useState<FormState>(() => makeEmptyForm(usuario?.id ?? ""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(makeEmptyForm(usuario?.id ?? ""))
      setError(null)
    }
  }, [open, usuario?.id])

  const set = (field: keyof Omit<FormState, "tiene_permuta" | "permuta">) =>
    (val: string | null) => setForm((prev) => ({ ...prev, [field]: val ?? "" }))

  const setPermuta = (field: keyof PermutaState) => (val: string | null) => {
    const v = val ?? ""
    setForm((prev) => {
      const next = { ...prev, permuta: { ...prev.permuta, [field]: v } }
      if (field === "precio_toma") {
        next.paga_permuta = v
      }
      return next
    })
  }

  const togglePermuta = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      tiene_permuta: checked,
      permuta: checked ? prev.permuta : { ...EMPTY_PERMUTA },
      paga_permuta: checked ? prev.paga_permuta : "",
    }))
  }

  // Live pago indicator
  const pagoIndicator = useMemo(() => {
    const contado = parsePrice(form.paga_contado) ?? 0
    const permuta = parsePrice(form.paga_permuta) ?? 0
    const financiado = parsePrice(form.paga_financiado) ?? 0
    const total = contado + permuta + financiado
    const precio = parsePrice(form.precio_venta) ?? 0
    if (!precio) return null
    const diff = total - precio
    if (diff === 0) return { type: "ok", label: "âœ“ Coincide" }
    if (diff < 0) return { type: "falta", label: `Faltan ${formatPriceARS(Math.abs(diff))}` }
    return { type: "sobra", label: `Sobran ${formatPriceARS(diff)}` }
  }, [form.paga_contado, form.paga_permuta, form.paga_financiado, form.precio_venta])

  const showFinanciacion = (parsePrice(form.paga_financiado) ?? 0) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!auto) return
    if (!form.comprador_nombre.trim() || !form.comprador_apellido.trim()) {
      setError("Nombre y apellido del comprador son obligatorios.")
      return
    }

    setLoading(true)
    setError(null)

    const ventaPayload = {
      auto_id: auto.id,
      estado_operacion: "senado" as const,
      fecha_senia: form.fecha_senia,
      senia: parsePrice(form.senia),
      lugar_senia: form.lugar_senia.trim() || null,
      vendedor_id: form.vendedor_id,
      procedencia: form.procedencia.trim() || null,
      precio_venta: parsePrice(form.precio_venta),
      paga_contado: parsePrice(form.paga_contado),
      paga_permuta: parsePrice(form.paga_permuta),
      paga_financiado: parsePrice(form.paga_financiado),
      financiera: showFinanciacion ? (form.financiera || null) : null,
      cantidad_cuotas: showFinanciacion && form.cantidad_cuotas ? parseInt(form.cantidad_cuotas) : null,
      costo_prenda: showFinanciacion ? parsePrice(form.costo_prenda) : null,
      comprador_nombre: form.comprador_nombre.trim(),
      comprador_apellido: form.comprador_apellido.trim(),
      comprador_dni: form.comprador_dni.trim() || null,
      comprador_domicilio: form.comprador_domicilio.trim() || null,
      comprador_telefono: form.comprador_telefono.trim() || null,
    }

    const permutaPayload = form.tiene_permuta && form.permuta.dominio.trim()
      ? {
          dominio: form.permuta.dominio.toUpperCase().trim(),
          marca: form.permuta.marca.trim(),
          modelo: form.permuta.modelo.trim(),
          version: form.permuta.version.trim() || null,
          anio: form.permuta.anio ? parseInt(form.permuta.anio) : null,
          km: form.permuta.km ? parseInt(form.permuta.km) : null,
          color: form.permuta.color.trim() || null,
          combustible: form.permuta.combustible || null,
          precio_compra_ars: parsePrice(form.permuta.precio_toma),
        }
      : null

    const { error: err } = await saveVenta(ventaPayload, permutaPayload)
    setLoading(false)

    if (err) {
      setError(`Error al guardar: ${err.message}`)
      return
    }
    onSaved()
    onClose()
  }

  if (!auto) return null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:max-w-[56rem] flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>SeÃ±ar auto</SheetTitle>
          {/* Auto info readonly */}
          <div className="mt-1 inline-flex items-center gap-2 bg-muted rounded-[10px] px-3 py-1.5 w-fit">
            <span className="font-mono font-semibold text-sm tracking-wider text-foreground">
              {auto.dominio}
            </span>
            <span className="text-muted-foreground text-sm">â€”</span>
            <span className="text-sm text-foreground">
              {auto.marca} {auto.modelo}
              {auto.anio ? ` (${auto.anio})` : ""}
            </span>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-6">

            {/* SEÃ‘A */}
            <Section title="SeÃ±a">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Fecha de seÃ±a *">
                  <Input
                    type="date"
                    value={form.fecha_senia}
                    onChange={(e) => set("fecha_senia")(e.target.value)}
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Monto seÃ±a ($)">
                  <Input
                    value={form.senia}
                    onChange={(e) => set("senia")(e.target.value)}
                    placeholder="500000"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Lugar seÃ±a">
                  <Input
                    value={form.lugar_senia}
                    onChange={(e) => set("lugar_senia")(capFirst(e.target.value))}
                    placeholder="Agencia / otro"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
              </div>
            </Section>

            <Separator />

            {/* COMERCIAL */}
            <Section title="Comercial">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Vendedor">
                  <Select value={form.vendedor_id} onValueChange={set("vendedor_id")}>
                    <SelectTrigger className="w-full h-10 rounded-[10px]">
                      <SelectValue placeholder="SeleccionÃ¡..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre} {u.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Procedencia">
                  <Input
                    value={form.procedencia}
                    onChange={(e) => set("procedencia")(capFirst(e.target.value))}
                    placeholder="Instagram, boca a boca..."
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Precio de venta ($)">
                  <Input
                    value={form.precio_venta}
                    onChange={(e) => set("precio_venta")(e.target.value)}
                    placeholder="0"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
              </div>
            </Section>

            <Separator />

            {/* PAGO COMBINADO */}
            <Section title="Forma de pago">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Contado ($)">
                  <Input
                    value={form.paga_contado}
                    onChange={(e) => set("paga_contado")(e.target.value)}
                    placeholder="0"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Permuta ($)">
                  <Input
                    value={form.paga_permuta}
                    onChange={(e) => set("paga_permuta")(e.target.value)}
                    placeholder="0"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Financiado ($)">
                  <Input
                    value={form.paga_financiado}
                    onChange={(e) => set("paga_financiado")(e.target.value)}
                    placeholder="0"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
              </div>

              {/* Indicator */}
              {pagoIndicator && (
                <div
                  className={`mt-2 rounded-[10px] px-3 py-2 text-sm font-medium ${
                    pagoIndicator.type === "ok"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : pagoIndicator.type === "falta"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {pagoIndicator.label}
                </div>
              )}

              {/* FinanciaciÃ³n */}
              {showFinanciacion && (
                <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-border">
                  <Field label="Financiera">
                    <Select value={form.financiera} onValueChange={set("financiera")}>
                      <SelectTrigger className="w-full h-10 rounded-[10px]">
                        <SelectValue placeholder="SeleccionÃ¡..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FINANCIERAS.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Cantidad de cuotas">
                    <Input
                      type="number"
                      value={form.cantidad_cuotas}
                      onChange={(e) => set("cantidad_cuotas")(e.target.value)}
                      placeholder="12"
                      min={1}
                      className="h-10 rounded-[10px]"
                    />
                  </Field>
                  <Field label="Costo de prenda ($)">
                    <Input
                      value={form.costo_prenda}
                      onChange={(e) => set("costo_prenda")(e.target.value)}
                      placeholder="0"
                      className="h-10 rounded-[10px]"
                    />
                  </Field>
                </div>
              )}
            </Section>

            <Separator />

            {/* COMPRADOR */}
            <Section title="Comprador">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *">
                  <Input
                    value={form.comprador_nombre}
                    onChange={(e) => set("comprador_nombre")(capFirst(e.target.value))}
                    placeholder="Juan"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Apellido *">
                  <Input
                    value={form.comprador_apellido}
                    onChange={(e) => set("comprador_apellido")(capFirst(e.target.value))}
                    placeholder="GarcÃ­a"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="DNI">
                  <Input
                    value={form.comprador_dni}
                    onChange={(e) => set("comprador_dni")(e.target.value)}
                    placeholder="12345678"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="TelÃ©fono">
                  <Input
                    value={form.comprador_telefono}
                    onChange={(e) => set("comprador_telefono")(e.target.value)}
                    placeholder="351 000 0000"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
                <Field label="Domicilio">
                  <Input
                    value={form.comprador_domicilio}
                    onChange={(e) => set("comprador_domicilio")(capFirst(e.target.value))}
                    placeholder="Av. Siempre Viva 742"
                    className="h-10 rounded-[10px]"
                  />
                </Field>
              </div>
            </Section>

            <Separator />

            {/* PERMUTA */}
            <Section title="Permuta">
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.tiene_permuta}
                  onChange={(e) => togglePermuta(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground">
                  Â¿Entra un auto en parte de pago?
                </span>
              </label>

              {form.tiene_permuta && (
                <div className="mt-4 space-y-3 rounded-[12px] border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Datos del usado
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dominio *">
                      <Input
                        value={form.permuta.dominio}
                        onChange={(e) => setPermuta("dominio")(e.target.value.toUpperCase())}
                        placeholder="AB123CD"
                        className="h-10 rounded-[10px] uppercase"
                        maxLength={10}
                      />
                    </Field>
                    <Field label="Precio de toma ($)">
                      <Input
                        value={form.permuta.precio_toma}
                        onChange={(e) => setPermuta("precio_toma")(e.target.value)}
                        placeholder="0"
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Marca">
                      <Input
                        value={form.permuta.marca}
                        onChange={(e) => setPermuta("marca")(capFirst(e.target.value))}
                        placeholder="Ford"
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                    <Field label="Modelo">
                      <Input
                        value={form.permuta.modelo}
                        onChange={(e) => setPermuta("modelo")(capFirst(e.target.value))}
                        placeholder="Focus"
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="VersiÃ³n">
                      <Input
                        value={form.permuta.version}
                        onChange={(e) => setPermuta("version")(capFirst(e.target.value))}
                        placeholder="SE 1.6"
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                    <Field label="AÃ±o">
                      <Input
                        type="number"
                        value={form.permuta.anio}
                        onChange={(e) => setPermuta("anio")(e.target.value)}
                        placeholder="2018"
                        min={1950}
                        max={2100}
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                    <Field label="KM">
                      <Input
                        type="number"
                        value={form.permuta.km}
                        onChange={(e) => setPermuta("km")(e.target.value)}
                        placeholder="80000"
                        min={0}
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Color">
                      <Input
                        value={form.permuta.color}
                        onChange={(e) => setPermuta("color")(capFirst(e.target.value))}
                        placeholder="Gris"
                        className="h-10 rounded-[10px]"
                      />
                    </Field>
                    <Field label="Combustible">
                      <Select value={form.permuta.combustible} onValueChange={(v) => setPermuta("combustible")(v ?? "")}>
                        <SelectTrigger className="w-full h-10 rounded-[10px]">
                          <SelectValue placeholder="â€”" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">â€”</SelectItem>
                          <SelectItem value="Nafta">Nafta</SelectItem>
                          <SelectItem value="DiÃ©sel">DiÃ©sel</SelectItem>
                          <SelectItem value="GNC">GNC</SelectItem>
                          <SelectItem value="Nafta/GNC">Nafta/GNC</SelectItem>
                          <SelectItem value="HÃ­brido">HÃ­brido</SelectItem>
                          <SelectItem value="ElÃ©ctrico">ElÃ©ctrico</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  {form.permuta.precio_toma && (
                    <p className="text-xs text-muted-foreground">
                      El precio de toma se copia automÃ¡ticamente al campo "Permuta ($)" de la forma de pago.
                    </p>
                  )}
                </div>
              )}
            </Section>

            {error && (
              <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
                {error}
              </p>
            )}
          </div>
        </form>

        <SheetFooter className="border-t border-border px-5 py-3 flex-row justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-[10px]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-[12px] bg-brand-500 hover:bg-brand-600 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar seÃ±a"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      {children}
    </div>
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
