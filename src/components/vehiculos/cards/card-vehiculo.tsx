"use client"

import { Car } from "lucide-react"
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
import type { VehiculoCardState } from "@/types/vehiculos"

interface Props {
  value: VehiculoCardState
  onChange: (patch: Partial<VehiculoCardState>) => void
}

const COMBUSTIBLES = [
  { value: "nafta", label: "Nafta" },
  { value: "diesel", label: "Diésel" },
  { value: "gnc", label: "GNC" },
  { value: "nafta_gnc", label: "Nafta/GNC" },
  { value: "hibrido", label: "Híbrido" },
  { value: "electrico", label: "Eléctrico" },
]

export function CardVehiculo({ value, onChange }: Props) {
  return (
    <FormCard icon={Car} title="Información del vehículo" subtitle="Datos principales del auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Dominio <span className="text-destructive">*</span></Label>
          <Input
            value={value.dominio}
            onChange={(e) => onChange({ dominio: e.target.value.toUpperCase() })}
            placeholder="ABC123"
            className="font-mono uppercase rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Marca</Label>
          <Input
            value={value.marca}
            onChange={(e) => onChange({ marca: e.target.value })}
            placeholder="Toyota"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Modelo</Label>
          <Input
            value={value.modelo}
            onChange={(e) => onChange({ modelo: e.target.value })}
            placeholder="Corolla"
            className="rounded-[10px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Versión</Label>
          <Input
            value={value.version}
            onChange={(e) => onChange({ version: e.target.value })}
            placeholder="XEi"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Año</Label>
          <Input
            type="number"
            value={value.anio}
            onChange={(e) => onChange({ anio: e.target.value })}
            placeholder="2020"
            min={1900}
            max={new Date().getFullYear() + 1}
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Color</Label>
          <Input
            value={value.color}
            onChange={(e) => onChange({ color: e.target.value })}
            placeholder="Blanco"
            className="rounded-[10px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Kilómetros</Label>
          <Input
            value={value.km}
            onChange={(e) => onChange({ km: e.target.value })}
            placeholder="80.000"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Combustible</Label>
          <Select
            value={value.combustible || "none"}
            onValueChange={(v) => onChange({ combustible: !v || v === "none" ? "" : v })}
          >
            <SelectTrigger className="rounded-[10px]">
              <SelectValue placeholder="Seleccioná" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin especificar</SelectItem>
              {COMBUSTIBLES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fecha de ingreso</Label>
          <Input
            type="date"
            value={value.fecha_ingreso}
            onChange={(e) => onChange({ fecha_ingreso: e.target.value })}
            className="rounded-[10px]"
          />
        </div>
      </div>
    </FormCard>
  )
}
