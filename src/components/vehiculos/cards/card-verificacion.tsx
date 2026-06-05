"use client"

import { ShieldCheck } from "lucide-react"
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
import { ESTADO_VERIF_LABELS } from "@/types/consignacion"
import type { EstadoVerif } from "@/types/consignacion"
import type { VerificacionCardState } from "@/types/vehiculos"

interface Props {
  value: VerificacionCardState
  onChange: (patch: Partial<VerificacionCardState>) => void
  /** Solo administracion/direccion pueden editar; el resto la ve deshabilitada en Pendiente */
  editable: boolean
}

const ESTADOS = Object.keys(ESTADO_VERIF_LABELS) as EstadoVerif[]

export function CardVerificacion({ value, onChange, editable }: Props) {
  return (
    <FormCard
      icon={ShieldCheck}
      title="Verificación"
      subtitle={
        editable
          ? "Estado de la verificación policial"
          : "Queda en Pendiente — la gestiona administración"
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Estado de verificación</Label>
          <Select
            value={editable ? value.estado : "pendiente"}
            onValueChange={(v) => v && onChange({ estado: v })}
            disabled={!editable}
          >
            <SelectTrigger className="rounded-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_VERIF_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Turno de verificación</Label>
          <Input
            type="datetime-local"
            value={value.turno}
            onChange={(e) => onChange({ turno: e.target.value })}
            disabled={!editable}
            className="rounded-[10px]"
          />
        </div>
      </div>
    </FormCard>
  )
}
