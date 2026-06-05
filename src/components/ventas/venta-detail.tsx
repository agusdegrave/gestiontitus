"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatPriceARS } from "@/lib/utils"
import { ESTADO_OPERACION_LABELS } from "@/types/ventas"
import type { Venta } from "@/types/ventas"

interface Props {
  venta: Venta | null
  open: boolean
  onClose: () => void
}

export function VentaDetail({ venta, open, onClose }: Props) {
  if (!venta) return null

  const auto = venta.autos
  const vendedor = venta.vendedor
  const haContado = (venta.paga_contado ?? 0) > 0
  const haPermuta = (venta.paga_permuta ?? 0) > 0
  const haFinanciado = (venta.paga_financiado ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de operación</DialogTitle>
          {auto && (
            <div className="inline-flex items-center gap-2 bg-muted rounded-[10px] px-3 py-1.5 w-fit mt-1">
              <span className="font-mono font-semibold text-sm tracking-wider">{auto.dominio}</span>
              <span className="text-muted-foreground text-sm">—</span>
              <span className="text-sm">
                {auto.marca} {auto.modelo}
                {auto.anio ? ` (${auto.anio})` : ""}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</span>
            <EstadoChip estado={venta.estado_operacion} />
          </div>

          <Separator />

          {/* Seña */}
          <DetailSection title="Seña">
            <Row label="Fecha" value={venta.fecha_senia ? new Date(venta.fecha_senia + "T00:00:00").toLocaleDateString("es-AR") : "—"} />
            <Row label="Monto" value={formatPriceARS(venta.senia)} />
            <Row label="Lugar" value={venta.lugar_senia ?? "—"} />
          </DetailSection>

          <Separator />

          {/* Comercial */}
          <DetailSection title="Comercial">
            <Row label="Vendedor" value={vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : "—"} />
            <Row label="Procedencia" value={venta.procedencia ?? "—"} />
            <Row label="Precio de venta" value={formatPriceARS(venta.precio_venta)} />
          </DetailSection>

          <Separator />

          {/* Pago */}
          <DetailSection title="Forma de pago">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {haContado && <PagoChip label="Contado" />}
              {haPermuta && <PagoChip label="Permuta" color="purple" />}
              {haFinanciado && <PagoChip label="Financiado" color="blue" />}
            </div>
            {haContado && <Row label="Contado" value={formatPriceARS(venta.paga_contado)} />}
            {haPermuta && <Row label="Permuta" value={formatPriceARS(venta.paga_permuta)} />}
            {haFinanciado && <Row label="Financiado" value={formatPriceARS(venta.paga_financiado)} />}
            {haFinanciado && (
              <>
                <Row label="Financiera" value={venta.financiera ?? "—"} />
                <Row label="Cuotas" value={venta.cantidad_cuotas?.toString() ?? "—"} />
                <Row label="Costo prenda" value={formatPriceARS(venta.costo_prenda)} />
              </>
            )}
          </DetailSection>

          <Separator />

          {/* Comprador */}
          <DetailSection title="Comprador">
            <Row label="Nombre" value={`${venta.comprador_nombre} ${venta.comprador_apellido}`} />
            <Row label="DNI" value={venta.comprador_dni ?? "—"} />
            <Row label="Teléfono" value={venta.comprador_telefono ?? "—"} />
            <Row label="Domicilio" value={venta.comprador_domicilio ?? "—"} />
          </DetailSection>

          {venta.auto_entrega_id && (
            <>
              <Separator />
              <DetailSection title="Permuta">
                <p className="text-sm text-muted-foreground">
                  Auto de entrega registrado en el sistema.
                </p>
              </DetailSection>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  )
}

function EstadoChip({ estado }: { estado: Venta["estado_operacion"] }) {
  const styles: Record<string, string> = {
    senado: "bg-blue-100 text-blue-700",
    entregado: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium ${styles[estado] ?? "bg-stone-100 text-stone-600"}`}>
      {ESTADO_OPERACION_LABELS[estado]}
    </span>
  )
}

function PagoChip({ label, color = "green" }: { label: string; color?: "green" | "purple" | "blue" }) {
  const styles = {
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  }
  return (
    <span className={`inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium ${styles[color]}`}>
      {label}
    </span>
  )
}
