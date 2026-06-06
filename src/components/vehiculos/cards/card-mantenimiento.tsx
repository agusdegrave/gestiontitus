"use client"

import { Wrench } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormCard } from "./form-card"
import { capFirst } from "@/lib/utils"
import type { MantenimientoCardState } from "@/types/vehiculos"

interface Props {
  value: MantenimientoCardState
  onChange: (patch: Partial<MantenimientoCardState>) => void
}

export function CardMantenimiento({ value, onChange }: Props) {
  return (
    <FormCard icon={Wrench} title="Mantenimiento" subtitle="DistribuciÃ³n, service y otros datos mecÃ¡nicos">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo de distribuciÃ³n</Label>
          <Select
            value={value.tipo_distribucion || "none"}
            onValueChange={(v) => onChange({ tipo_distribucion: !v || v === "none" ? "" : v })}
          >
            <SelectTrigger className="rounded-[10px]">
              <SelectValue placeholder="â€”" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">â€”</SelectItem>
              <SelectItem value="correa">Correa</SelectItem>
              <SelectItem value="cadena">Cadena</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Km cambio de distribuciÃ³n</Label>
          <Input
            type="number"
            value={value.km_cambio_distribucion}
            onChange={(e) => onChange({ km_cambio_distribucion: e.target.value })}
            placeholder="100000"
            className="rounded-[10px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Km service</Label>
          <Input
            type="number"
            value={value.km_service}
            onChange={(e) => onChange({ km_service: e.target.value })}
            placeholder="10000"
            className="rounded-[10px]"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Otros mantenimientos</Label>
        <Textarea
          value={value.otros_mantenimientos}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange({ otros_mantenimientos: capFirst(e.target.value) })
          }
          placeholder="Cubiertas nuevas, frenos hechos, etc."
          className="rounded-[10px] resize-none"
          rows={3}
        />
      </div>
    </FormCard>
  )
}
