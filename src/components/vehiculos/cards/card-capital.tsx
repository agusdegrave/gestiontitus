"use client"

import { PiggyBank, Plus, X, CheckCircle2, AlertTriangle } from "lucide-react"
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
import { FormCard } from "./form-card"
import { formatPriceARS, formatPriceUSD, parsePrice } from "@/lib/utils"
import { NUEVO_SOCIO } from "@/types/vehiculos"
import type { CapitalCardState, InversorRow, Socio, Moneda } from "@/types/vehiculos"

interface Props {
  value: CapitalCardState
  onChange: (patch: Partial<CapitalCardState>) => void
  socios: Socio[]
}

let rowKey = 1000
export const nuevaFilaInversor = (overrides?: Partial<InversorRow>): InversorRow => ({
  key: ++rowKey,
  socio_id: "",
  nombre_nuevo: "",
  porcentaje: "",
  capital: "",
  moneda: "ARS",
  ...overrides,
})

export function CardCapital({ value, onChange, socios }: Props) {
  const updateRow = (key: number, patch: Partial<InversorRow>) =>
    onChange({
      inversores: value.inversores.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    })

  const removeRow = (key: number) =>
    onChange({ inversores: value.inversores.filter((r) => r.key !== key) })

  const addRow = () => onChange({ inversores: [...value.inversores, nuevaFilaInversor()] })

  // Indicadores en vivo
  const sumPct = value.inversores.reduce((acc, r) => {
    const n = parseFloat(r.porcentaje.replace(",", "."))
    return acc + (isNaN(n) ? 0 : n)
  }, 0)
  const totalARS = value.inversores.reduce(
    (acc, r) => acc + (r.moneda === "ARS" ? (parsePrice(r.capital) ?? 0) : 0),
    0
  )
  const totalUSD = value.inversores.reduce(
    (acc, r) => acc + (r.moneda === "USD" ? (parsePrice(r.capital) ?? 0) : 0),
    0
  )
  const pctCompleto = Math.abs(sumPct - 100) < 0.01

  return (
    <FormCard
      icon={PiggyBank}
      title="Distribución de capital"
      subtitle="Precio de compra e inversores del vehículo"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <Select
            value={value.moneda_compra}
            onValueChange={(v) => v && onChange({ moneda_compra: v as Moneda })}
          >
            <SelectTrigger className="rounded-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">Pesos (ARS)</SelectItem>
              <SelectItem value="USD">Dólares (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Precio de compra</Label>
          <Input
            value={value.precio_compra}
            onChange={(e) => onChange({ precio_compra: e.target.value })}
            placeholder={value.moneda_compra === "USD" ? "USD 0" : "$ 0"}
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cotización USD</Label>
          <Input
            value={value.cotizacion_usd}
            onChange={(e) => onChange({ cotizacion_usd: e.target.value })}
            placeholder="$ 0"
            className="rounded-[10px]"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-1">
          Inversores
        </h3>

        <div className="space-y-3">
          {value.inversores.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-1 sm:grid-cols-[1fr_90px_130px_100px_28px] gap-2 items-end rounded-[12px] border border-border bg-stone-50/50 p-3"
            >
              <div className="space-y-1">
                <Label className="text-xs">Inversor</Label>
                <Select
                  value={row.socio_id || "none"}
                  onValueChange={(v) =>
                    updateRow(row.key, { socio_id: !v || v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger className="rounded-[10px] h-9 bg-white">
                    <SelectValue placeholder="Elegí un socio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Elegí un socio</SelectItem>
                    {socios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} {s.apellido ?? ""}
                      </SelectItem>
                    ))}
                    <SelectItem value={NUEVO_SOCIO}>+ Nuevo inversor…</SelectItem>
                  </SelectContent>
                </Select>
                {row.socio_id === NUEVO_SOCIO && (
                  <Input
                    value={row.nombre_nuevo}
                    onChange={(e) => updateRow(row.key, { nombre_nuevo: e.target.value })}
                    placeholder="Nombre del nuevo inversor"
                    className="rounded-[10px] h-9 mt-1.5 bg-white"
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Porcentaje</Label>
                <Input
                  value={row.porcentaje}
                  onChange={(e) => updateRow(row.key, { porcentaje: e.target.value })}
                  placeholder="100"
                  className="rounded-[10px] h-9 bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Capital aportado</Label>
                <Input
                  value={row.capital}
                  onChange={(e) => updateRow(row.key, { capital: e.target.value })}
                  placeholder="0"
                  className="rounded-[10px] h-9 bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Moneda</Label>
                <Select
                  value={row.moneda}
                  onValueChange={(v) => v && updateRow(row.key, { moneda: v as Moneda })}
                >
                  <SelectTrigger className="rounded-[10px] h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="inline-flex items-center justify-center w-7 h-9 rounded-[8px] text-muted-foreground hover:text-destructive transition-colors"
                title="Quitar inversor"
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
          onClick={addRow}
          className="rounded-[10px] h-8 gap-1 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar inversionista
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
      </div>
    </FormCard>
  )
}
