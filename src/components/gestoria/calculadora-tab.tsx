"use client"

import { useState, useEffect } from "react"
import { Loader2, Calculator, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchGestores, fetchParametros } from "@/lib/gestoria"
import { formatPriceARS, parsePrice, cn } from "@/lib/utils"
import { PARAMETROS_DEFAULT } from "@/types/gestoria"
import type { Gestor, GestoriaParametros } from "@/types/gestoria"

interface CalcState {
  gestor_id: string
  valor_dnrpa: string
  valor_rentas: string
  cant_firmas: string
  cant_formularios: string
  monto_cuota: string
  cant_cuotas: string
}

const EMPTY_CALC: CalcState = {
  gestor_id: "",
  valor_dnrpa: "",
  valor_rentas: "",
  cant_firmas: "1",
  cant_formularios: "1",
  monto_cuota: "",
  cant_cuotas: "",
}

// Vacío o no parseable = 0
function toMonto(raw: string): number {
  return raw.trim() ? (parsePrice(raw) ?? 0) : 0
}

function toEntero(raw: string): number {
  const n = parseInt(raw, 10)
  return isNaN(n) ? 0 : n
}

function MontoInput({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "$ 0"}
        className="rounded-[10px]"
      />
      {value.trim() && (
        <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(value))}</p>
      )}
    </div>
  )
}

function ResultRow({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {label}
        {hint && <span className="text-xs ml-1.5 text-muted-foreground/70">({hint})</span>}
      </span>
      <span className="text-foreground font-medium tabular-nums">{formatPriceARS(value)}</span>
    </div>
  )
}

function TotalRow({ label, value, destacado }: { label: string; value: number; destacado?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[10px] px-3 py-2.5",
        destacado
          ? "bg-brand-500 text-white"
          : "bg-stone-50 border border-border text-foreground"
      )}
    >
      <span className={cn("font-semibold", destacado ? "text-sm" : "text-sm")}>{label}</span>
      <span className="font-bold tabular-nums">{formatPriceARS(value)}</span>
    </div>
  )
}

export function CalculadoraTab() {
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [parametros, setParametros] = useState<GestoriaParametros | null>(null)
  const [sinParametros, setSinParametros] = useState(false)
  const [loading, setLoading] = useState(true)

  const [calc, setCalc] = useState<CalcState>(EMPTY_CALC)

  useEffect(() => {
    async function load() {
      const [gestoresRes, params] = await Promise.all([fetchGestores(), fetchParametros()])
      setGestores(gestoresRes.data.filter((g) => g.activo))
      setParametros(params)
      setSinParametros(!params)
      setLoading(false)
    }
    load()
  }, [])

  function set<K extends keyof CalcState>(field: K) {
    return (value: string) => setCalc((p) => ({ ...p, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const p = parametros ?? { ...PARAMETROS_DEFAULT, id: "" }
  const gestor = gestores.find((g) => g.id === calc.gestor_id) ?? null

  // Cálculos en vivo (vacío = 0)
  const arancel = toMonto(calc.valor_dnrpa) * (p.pct_arancel / 100)
  const sellado = toMonto(calc.valor_rentas) * (p.pct_base_sellado / 100) * (p.pct_sellado / 100)
  const prenda = toMonto(calc.monto_cuota) * toEntero(calc.cant_cuotas) * (p.pct_prenda / 100)
  const honorario = gestor?.honorario ?? 0
  const altaBaja = p.costo_alta_baja
  const firmas = toEntero(calc.cant_firmas) * (gestor?.valor_firma ?? 0)
  const formularios = toEntero(calc.cant_formularios) * p.costo_formulario

  const totalTransferencia = arancel + sellado + prenda + honorario + altaBaja
  const totalFirmasFormularios = firmas + formularios
  const totalGeneral = totalTransferencia + totalFirmasFormularios

  return (
    <div className="space-y-4">
      {sinParametros && (
        <div className="rounded-[10px] bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm text-amber-700">
            <Info className="w-4 h-4 shrink-0" />
            No se encontraron parámetros de gestoría para la agencia; se usan valores por defecto.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* ── Entradas ─────────────────────────────── */}
        <div className="rounded-[14px] border border-border bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-stone-50">
            <h2 className="text-sm font-semibold text-foreground">Datos del trámite</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Gestor</Label>
              <Select value={calc.gestor_id} onValueChange={(v) => set("gestor_id")(v ?? "")}>
                <SelectTrigger className="rounded-[10px]">
                  <SelectValue placeholder="Seleccioná un gestor..." />
                </SelectTrigger>
                <SelectContent>
                  {gestores.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}{g.alias ? ` (${g.alias})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gestores.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay gestores activos. Cargalos en la pestaña Gestores.
                </p>
              )}
              {gestor && (
                <p className="text-xs text-muted-foreground">
                  Honorario {formatPriceARS(gestor.honorario)} · Firma {formatPriceARS(gestor.valor_firma)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MontoInput
                label="Valor tabla DNRPA"
                value={calc.valor_dnrpa}
                onChange={set("valor_dnrpa")}
              />
              <MontoInput
                label="Valor tabla Rentas"
                value={calc.valor_rentas}
                onChange={set("valor_rentas")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cantidad de firmas</Label>
                <Input
                  type="number"
                  min={0}
                  value={calc.cant_firmas}
                  onChange={(e) => set("cant_firmas")(e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cantidad de formularios</Label>
                <Input
                  type="number"
                  min={0}
                  value={calc.cant_formularios}
                  onChange={(e) => set("cant_formularios")(e.target.value)}
                  className="rounded-[10px]"
                />
              </div>
            </div>

            <div className="pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Prenda (si aplica)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MontoInput
                  label="Monto de cuota"
                  value={calc.monto_cuota}
                  onChange={set("monto_cuota")}
                />
                <div className="space-y-1.5">
                  <Label>Cantidad de cuotas</Label>
                  <Input
                    type="number"
                    min={0}
                    value={calc.cant_cuotas}
                    onChange={(e) => set("cant_cuotas")(e.target.value)}
                    placeholder="0"
                    className="rounded-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Resultados ───────────────────────────── */}
        <div className="rounded-[14px] border border-border bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border bg-stone-50 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-foreground">Desglose</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-2">
              <ResultRow label="Arancel" value={arancel} hint={`${p.pct_arancel}% DNRPA`} />
              <ResultRow
                label="Sellado"
                value={sellado}
                hint={`${p.pct_sellado}% del ${p.pct_base_sellado}% Rentas`}
              />
              <ResultRow label="Prenda" value={prenda} hint={`${p.pct_prenda}%`} />
              <ResultRow label="Honorario" value={honorario} />
              <ResultRow label="Alta y baja" value={altaBaja} />
              <TotalRow label="Total transferencia" value={totalTransferencia} />
            </div>

            <div className="space-y-2">
              <ResultRow
                label="Firmas"
                value={firmas}
                hint={`${toEntero(calc.cant_firmas)} × ${formatPriceARS(gestor?.valor_firma ?? 0)}`}
              />
              <ResultRow
                label="Formularios"
                value={formularios}
                hint={`${toEntero(calc.cant_formularios)} × ${formatPriceARS(p.costo_formulario)}`}
              />
              <TotalRow label="Total firmas y formularios" value={totalFirmasFormularios} />
            </div>

            <TotalRow label="Total general" value={totalGeneral} destacado />
          </div>
        </div>
      </div>
    </div>
  )
}
