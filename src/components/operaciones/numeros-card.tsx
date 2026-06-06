"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle, EyeOff, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  fetchOperacionItems,
  insertOperacionItem,
  updateOperacionItem,
  deleteOperacionItem,
} from "@/lib/ventas"
import { formatPriceARS, parsePrice, capFirst, cn } from "@/lib/utils"
import type { Venta, OperacionItem } from "@/types/ventas"

interface Props {
  venta: Venta
  canEdit: boolean
}

// Ítem automático: sale de ventas, no es editable como ítem,
// pero se puede excluir del cálculo (solo localmente).
interface AutoItem {
  key: string
  concepto: string
  monto: number
  signo: 1 | -1
}

// Sugerencias rápidas para gastos del usado (precargan el form, editables)
const SUGERENCIAS_PERMUTA = [
  { concepto: "Formulario 08", monto: 18000 },
  { concepto: "Firma escribanía x persona", monto: 17500 },
  { concepto: "Verificación policial", monto: 45000 },
]

interface Draft {
  concepto: string
  monto: string
  signo: 1 | -1
}

function buildAutoItems(v: Venta): AutoItem[] {
  const deudasVendido =
    (v.deuda_muni ?? 0) + (v.deuda_rentas ?? 0) + (v.deuda_multas ?? 0) + (v.gastos_consigna ?? 0)
  const items: AutoItem[] = [
    { key: "venta", concepto: "Valor de venta", monto: v.precio_venta ?? 0, signo: 1 },
  ]
  if ((v.costo_transferencia ?? 0) > 0)
    items.push({ key: "transferencia", concepto: "Transferencia", monto: v.costo_transferencia!, signo: 1 })
  if ((v.costo_prenda ?? 0) > 0)
    items.push({ key: "prenda", concepto: "Prenda", monto: v.costo_prenda!, signo: 1 })
  if (deudasVendido > 0)
    items.push({ key: "deudas", concepto: "Deudas a sumar", monto: deudasVendido, signo: 1 })
  if ((v.senia ?? 0) > 0)
    items.push({ key: "senia", concepto: "Seña", monto: v.senia!, signo: -1 })
  if ((v.paga_financiado ?? 0) > 0)
    items.push({ key: "financiado", concepto: "Monto financiado / crédito", monto: v.paga_financiado!, signo: -1 })
  if (v.auto_entrega_id && (v.paga_permuta ?? 0) > 0)
    items.push({ key: "permuta", concepto: "Toma de permuta", monto: v.paga_permuta!, signo: -1 })
  return items
}

function Monto({ monto, signo, dim }: { monto: number; signo: 1 | -1; dim?: boolean }) {
  return (
    <span
      className={cn(
        "tabular-nums font-medium shrink-0",
        dim ? "text-muted-foreground line-through" : signo === 1 ? "text-green-600" : "text-red-600"
      )}
    >
      {signo === 1 ? "+" : "−"}{formatPriceARS(monto)}
    </span>
  )
}

// Fila estilo estado de cuenta: concepto ........ +$X
function FilaItem({ concepto, monto, signo, dim, acciones }: {
  concepto: string
  monto: number
  signo: 1 | -1
  dim?: boolean
  acciones?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <span className={cn("shrink-0", dim ? "text-muted-foreground line-through" : "text-foreground")}>
        {concepto}
      </span>
      <span className="flex-1 border-b border-dotted border-stone-300 mx-1 translate-y-1" />
      <Monto monto={monto} signo={signo} dim={dim} />
      {acciones}
    </div>
  )
}

function SubtotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-[10px] bg-stone-50 border border-border px-3 py-2 mt-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className={cn("font-bold tabular-nums", value < 0 ? "text-red-600" : "text-foreground")}>
        {formatPriceARS(value)}
      </span>
    </div>
  )
}

// Form inline para agregar/editar un ítem libre
function ItemForm({ draft, onChange, onConfirm, onCancel, busy }: {
  draft: Draft
  onChange: (d: Draft) => void
  onConfirm: () => void
  onCancel: () => void
  busy: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-1">
      <Input
        value={draft.concepto}
        onChange={(e) => onChange({ ...draft, concepto: capFirst(e.target.value) })}
        placeholder="Concepto..."
        className="rounded-[10px] h-8 flex-1 min-w-[140px]"
        autoFocus
      />
      <Input
        value={draft.monto}
        onChange={(e) => onChange({ ...draft, monto: e.target.value })}
        placeholder="$ 0"
        className="rounded-[10px] h-8 w-28"
      />
      <button
        type="button"
        onClick={() => onChange({ ...draft, signo: draft.signo === 1 ? -1 : 1 })}
        className={cn(
          "h-8 w-8 shrink-0 rounded-[8px] border text-sm font-bold transition-colors",
          draft.signo === 1
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-red-300 bg-red-50 text-red-600"
        )}
        title={draft.signo === 1 ? "Suma (click para restar)" : "Resta (click para sumar)"}
      >
        {draft.signo === 1 ? "+" : "−"}
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="p-1.5 rounded-[8px] text-green-600 hover:bg-green-50 transition-colors"
          title="Confirmar"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="p-1.5 rounded-[8px] text-muted-foreground hover:bg-muted transition-colors"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function NumerosCard({ venta, canEdit }: Props) {
  const [items, setItems] = useState<OperacionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Ítems automáticos excluidos del cálculo (solo local, no se persiste)
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())

  // Form de alta por bloque, y edición inline por id
  const [nuevoEn, setNuevoEn] = useState<"principal" | "permuta" | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({ concepto: "", monto: "", signo: 1 })

  const load = useCallback(async () => {
    const { data, error: err } = await fetchOperacionItems(venta.id)
    if (err) setError(`No se pudieron cargar los ítems: ${err.message}`)
    setItems(data)
    setLoading(false)
  }, [venta.id])

  useEffect(() => { load() }, [load])

  const autoItems = buildAutoItems(venta)
  const libresPrincipal = items.filter((i) => i.bloque === "principal")
  const libresPermuta = items.filter((i) => i.bloque === "permuta")
  const hayPermuta = !!venta.auto_entrega_id

  const subtotal1 =
    autoItems.reduce((acc, it) => acc + (excluidos.has(it.key) ? 0 : it.monto * it.signo), 0) +
    libresPrincipal.reduce((acc, it) => acc + it.monto * it.signo, 0)
  const subtotal2 = libresPermuta.reduce((acc, it) => acc + it.monto * it.signo, 0)
  const totalFinal = subtotal1 + subtotal2

  function toggleExcluido(key: string) {
    if (!canEdit) return
    setExcluidos((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function abrirNuevo(bloque: "principal" | "permuta", pre?: { concepto: string; monto: number }) {
    setEditandoId(null)
    setNuevoEn(bloque)
    setDraft({
      concepto: pre?.concepto ?? "",
      monto: pre?.monto?.toString() ?? "",
      // Gastos del usado restan por defecto; en principal por defecto suma
      signo: bloque === "permuta" ? -1 : 1,
    })
    setError(null)
  }

  function abrirEdicion(item: OperacionItem) {
    setNuevoEn(null)
    setEditandoId(item.id)
    setDraft({ concepto: item.concepto, monto: item.monto.toString(), signo: item.signo })
    setError(null)
  }

  function validarDraft(): { concepto: string; monto: number } | null {
    const monto = draft.monto.trim() ? parsePrice(draft.monto) : null
    if (!draft.concepto.trim()) {
      setError("El concepto es obligatorio.")
      return null
    }
    if (monto == null || monto <= 0) {
      setError("El monto debe ser mayor a 0.")
      return null
    }
    return { concepto: draft.concepto.trim(), monto }
  }

  async function confirmarNuevo() {
    const valido = validarDraft()
    if (!valido || !nuevoEn) return
    setBusy(true)
    setError(null)
    // NO mandar agencia_id ni auditoría: los completa la base
    const { data, error: err } = await insertOperacionItem({
      venta_id: venta.id,
      concepto: valido.concepto,
      monto: valido.monto,
      signo: draft.signo,
      bloque: nuevoEn,
    })
    setBusy(false)
    if (err || !data) {
      setError(err?.message ?? "No se pudo guardar el ítem.")
      return
    }
    setItems((prev) => [...prev, data as OperacionItem])
    setNuevoEn(null)
  }

  async function confirmarEdicion() {
    const valido = validarDraft()
    if (!valido || !editandoId) return
    setBusy(true)
    setError(null)
    const { error: err } = await updateOperacionItem(editandoId, {
      concepto: valido.concepto,
      monto: valido.monto,
      signo: draft.signo,
    })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === editandoId ? { ...i, concepto: valido.concepto, monto: valido.monto, signo: draft.signo } : i
      )
    )
    setEditandoId(null)
  }

  async function borrar(id: string) {
    setBusy(true)
    setError(null)
    const { error: err } = await deleteOperacionItem(id)
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function accionesDe(item: OperacionItem) {
    if (!canEdit) return undefined
    return (
      <span className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => abrirEdicion(item)}
          className="p-1 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Editar"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => borrar(item.id)}
          disabled={busy}
          className="p-1 rounded-[6px] text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
          title="Borrar"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </span>
    )
  }

  function renderLibre(item: OperacionItem) {
    if (editandoId === item.id) {
      return (
        <ItemForm
          key={item.id}
          draft={draft}
          onChange={setDraft}
          onConfirm={confirmarEdicion}
          onCancel={() => setEditandoId(null)}
          busy={busy}
        />
      )
    }
    return (
      <FilaItem
        key={item.id}
        concepto={item.concepto}
        monto={item.monto}
        signo={item.signo}
        acciones={accionesDe(item)}
      />
    )
  }

  function botonAgregar(bloque: "principal" | "permuta") {
    if (!canEdit || nuevoEn === bloque) return null
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => abrirNuevo(bloque)}
        className="rounded-[10px] h-7 gap-1 text-xs mt-1"
      >
        <Plus className="w-3 h-3" />
        Agregar ítem
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Bloque 1: Operación principal ────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Operación principal
        </p>
        <div className="space-y-0.5">
          {autoItems.map((it) => {
            const off = excluidos.has(it.key)
            return (
              <FilaItem
                key={it.key}
                concepto={it.concepto}
                monto={it.monto}
                signo={it.signo}
                dim={off}
                acciones={
                  canEdit ? (
                    <button
                      type="button"
                      onClick={() => toggleExcluido(it.key)}
                      className="p-1 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      title={off ? "Incluir en el cálculo" : "Excluir del cálculo"}
                    >
                      {off ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  ) : undefined
                }
              />
            )
          })}
          {libresPrincipal.map(renderLibre)}
          {nuevoEn === "principal" && (
            <ItemForm
              draft={draft}
              onChange={setDraft}
              onConfirm={confirmarNuevo}
              onCancel={() => setNuevoEn(null)}
              busy={busy}
            />
          )}
        </div>
        {botonAgregar("principal")}
        <SubtotalRow label="A cancelar en efectivo" value={subtotal1} />
      </div>

      {/* ── Bloque 2: Gastos del auto de permuta ─────── */}
      {hayPermuta && (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Gastos del auto de permuta
            </p>
            {venta.auto_entrega && (
              <span className="text-xs text-muted-foreground font-mono">{venta.auto_entrega.dominio}</span>
            )}
          </div>
          <div className="space-y-0.5">
            {libresPermuta.length === 0 && nuevoEn !== "permuta" && (
              <p className="text-sm text-muted-foreground">Sin gastos cargados.</p>
            )}
            {libresPermuta.map(renderLibre)}
            {nuevoEn === "permuta" && (
              <ItemForm
                draft={draft}
                onChange={setDraft}
                onConfirm={confirmarNuevo}
                onCancel={() => setNuevoEn(null)}
                busy={busy}
              />
            )}
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {botonAgregar("permuta")}
              {SUGERENCIAS_PERMUTA.map((s) => (
                <button
                  key={s.concepto}
                  type="button"
                  onClick={() => abrirNuevo("permuta", s)}
                  className="rounded-[8px] border border-border bg-stone-50 hover:bg-stone-100 px-2 py-1 text-xs text-muted-foreground transition-colors"
                >
                  {s.concepto} · {formatPriceARS(s.monto)}
                </button>
              ))}
            </div>
          )}
          <SubtotalRow label="Total gastos del usado" value={subtotal2} />
        </div>
      )}

      {/* ── Bloque 3: Números finales ────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Números finales
        </p>
        {hayPermuta && (
          <div className="space-y-1 text-sm mb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>A cancelar en efectivo</span>
              <span className="tabular-nums">{formatPriceARS(subtotal1)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Total gastos del usado</span>
              <span className="tabular-nums">{formatPriceARS(subtotal2)}</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between rounded-[10px] bg-brand-500 text-white px-4 py-3">
          <span className="text-sm font-semibold">Total final que trae el cliente</span>
          <span className="text-lg font-bold tabular-nums">{formatPriceARS(totalFinal)}</span>
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
