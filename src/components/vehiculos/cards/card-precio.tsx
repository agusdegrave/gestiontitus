"use client"

import { DollarSign } from "lucide-react"
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
import type { PrecioCardState, Moneda } from "@/types/vehiculos"

interface Props {
  value: PrecioCardState
  onChange: (patch: Partial<PrecioCardState>) => void
}

export function CardPrecio({ value, onChange }: Props) {
  return (
    <FormCard icon={DollarSign} title="Precio" subtitle="Valores de referencia y publicación">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Precio de INFO</Label>
          <Input
            value={value.precio_info}
            onChange={(e) => onChange({ precio_info: e.target.value })}
            placeholder="$ 0"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Moneda de publicación</Label>
          <Select
            value={value.moneda_publicacion}
            onValueChange={(v) => v && onChange({ moneda_publicacion: v as Moneda })}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Precio pretendido</Label>
          <Input
            value={value.precio_pretendido}
            onChange={(e) => onChange({ precio_pretendido: e.target.value })}
            placeholder="$ 0"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Precio de publicación</Label>
          <Input
            value={value.precio_publicado}
            onChange={(e) => onChange({ precio_publicado: e.target.value })}
            placeholder="$ 0"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Calificación del precio</Label>
          <Select
            value={value.calificacion_precio || "none"}
            onValueChange={(v) => onChange({ calificacion_precio: !v || v === "none" ? "" : v })}
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
      </div>
    </FormCard>
  )
}
