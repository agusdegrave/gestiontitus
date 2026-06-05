"use client"

import { Handshake } from "lucide-react"
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
import type { ConsignaCardState } from "@/types/vehiculos"
import type { UsuarioSimple } from "@/types/stock"

interface Props {
  value: ConsignaCardState
  onChange: (patch: Partial<ConsignaCardState>) => void
  usuarios: UsuarioSimple[]
}

export function CardConsignacion({ value, onChange, usuarios }: Props) {
  return (
    <FormCard
      icon={Handshake}
      title="Información de consignación"
      subtitle="Responsable y datos del dueño del vehículo"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Responsable</Label>
          <Select
            value={value.responsable_id || "none"}
            onValueChange={(v) => onChange({ responsable_id: !v || v === "none" ? "" : v })}
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
        <div className="space-y-1.5">
          <Label>Tipo de consigna</Label>
          <Select value={value.tipo_consigna} onValueChange={(v) => v && onChange({ tipo_consigna: v })}>
            <SelectTrigger className="rounded-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Física</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground pt-1">
          Información del cliente
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={value.duenio_nombre}
              onChange={(e) => onChange({ duenio_nombre: e.target.value })}
              placeholder="Juan"
              className="rounded-[10px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Apellido</Label>
            <Input
              value={value.duenio_apellido}
              onChange={(e) => onChange({ duenio_apellido: e.target.value })}
              placeholder="Pérez"
              className="rounded-[10px]"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input
              value={value.duenio_telefono}
              onChange={(e) => onChange({ duenio_telefono: e.target.value })}
              placeholder="11 1234-5678"
              className="rounded-[10px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Domicilio</Label>
            <Input
              value={value.duenio_domicilio}
              onChange={(e) => onChange({ duenio_domicilio: e.target.value })}
              placeholder="Av. Corrientes 1234"
              className="rounded-[10px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>DNI</Label>
            <Input
              value={value.duenio_dni}
              onChange={(e) => onChange({ duenio_dni: e.target.value })}
              placeholder="12.345.678"
              className="rounded-[10px]"
            />
          </div>
        </div>
      </div>
    </FormCard>
  )
}
