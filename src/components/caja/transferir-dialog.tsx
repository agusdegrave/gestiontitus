"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, ArrowRight } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { transferir } from "@/lib/caja"
import { parsePrice, formatPriceARS, formatPriceUSD, capFirst } from "@/lib/utils"
import type { CajaSaldo } from "@/types/caja"

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  origen: CajaSaldo | null
  cajas: CajaSaldo[]
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function TransferirDialog({ open, onClose, onSaved, origen, cajas }: Props) {
  const [destinoId, setDestinoId] = useState("")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(todayISO())
  const [concepto, setConcepto] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDestinoId("")
      setMonto("")
      setFecha(todayISO())
      setConcepto("")
      setError(null)
    }
  }, [open])

  // Solo cajas de la MISMA moneda (sin la de origen)
  const destinos = cajas.filter((c) => c.id !== origen?.id && c.moneda === origen?.moneda)
  const formatMoneda = origen?.moneda === "USD" ? formatPriceUSD : formatPriceARS

  async function handleTransferir() {
    const m = monto.trim() ? parsePrice(monto) : null
    if (!destinoId) {
      setError("Elegí la caja destino.")
      return
    }
    if (!m || m <= 0) {
      setError("El monto debe ser mayor a 0.")
      return
    }
    if (!origen) return
    setSaving(true)
    setError(null)
    const { error: err } = await transferir({
      origen: origen.id,
      destino: destinoId,
      monto: m,
      fecha: fecha || todayISO(),
      concepto: concepto.trim() || `Transferencia desde ${origen.nombre}`,
    })
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
      <DialogContent className="sm:max-w-md rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Transferir entre cajas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-[10px] bg-stone-50 border border-border px-3 py-2.5 text-sm">
            <span className="font-medium text-foreground">{origen?.nombre}</span>
            <span className="text-xs text-muted-foreground">({origen?.moneda})</span>
            <ArrowRight className="w-4 h-4 text-brand-500 shrink-0" />
            <div className="flex-1">
              <Select value={destinoId} onValueChange={(v) => setDestinoId(v ?? "")}>
                <SelectTrigger className="rounded-[10px] h-8">
                  <SelectValue placeholder="Caja destino..." />
                </SelectTrigger>
                <SelectContent>
                  {destinos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {destinos.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay otras cajas en {origen?.moneda} para transferir.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto *</Label>
              <Input
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="$ 0"
                className="rounded-[10px]"
              />
              {monto.trim() && (
                <p className="text-xs text-muted-foreground">{formatMoneda(parsePrice(monto))}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="rounded-[10px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Concepto</Label>
            <Input
              value={concepto}
              onChange={(e) => setConcepto(capFirst(e.target.value))}
              placeholder={`Transferencia desde ${origen?.nombre ?? "..."}`}
              className="rounded-[10px]"
            />
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
            Cancelar
          </Button>
          <Button
            onClick={handleTransferir}
            disabled={saving || destinos.length === 0}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
