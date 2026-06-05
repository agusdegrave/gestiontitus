"use client"

import { FileSearch } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormCard } from "./form-card"
import { ESTADO_INFORME_LABELS } from "@/types/consignacion"
import type { EstadoInforme } from "@/types/consignacion"
import type { InformesCardState } from "@/types/vehiculos"

interface Props {
  value: InformesCardState
  onChange: (patch: Partial<InformesCardState>) => void
  /** Solo administracion/direccion pueden editar; el resto la ve deshabilitada en Pendiente */
  editable: boolean
}

const ESTADOS = Object.keys(ESTADO_INFORME_LABELS) as EstadoInforme[]

function SelectEstado({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)} disabled={disabled}>
      <SelectTrigger className="rounded-[10px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ESTADOS.map((e) => (
          <SelectItem key={e} value={e}>
            {ESTADO_INFORME_LABELS[e]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CardInformes({ value, onChange, editable }: Props) {
  return (
    <FormCard
      icon={FileSearch}
      title="Informes"
      subtitle={
        editable
          ? "Informe de dominio y de multas"
          : "Quedan en Pendiente — los gestiona administración"
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Informe de dominio — Estado</Label>
          <SelectEstado
            value={editable ? value.dominio : "pendiente"}
            onChange={(v) => onChange({ dominio: v })}
            disabled={!editable}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Informe de multas — Estado</Label>
          <SelectEstado
            value={editable ? value.multas : "pendiente"}
            onChange={(v) => onChange({ multas: v })}
            disabled={!editable}
          />
        </div>
      </div>
    </FormCard>
  )
}
