"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { VentaFilters } from "@/types/ventas"

interface Props {
  filters: VentaFilters
  total: number
  loading: boolean
  onChange: (f: VentaFilters) => void
}

export function OperacionesFilters({ filters, total, loading, onChange }: Props) {
  const set = (field: keyof VentaFilters) => (val: string | null) =>
    onChange({ ...filters, [field]: val ?? "" })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Buscar por dominio o comprador..."
        value={filters.search}
        onChange={(e) => set("search")(e.target.value)}
        className="h-9 rounded-[10px] w-64"
      />

      <Select value={filters.estado_operacion} onValueChange={set("estado_operacion")}>
        <SelectTrigger className="h-9 rounded-[10px] w-36">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="senado">Señado</SelectItem>
          <SelectItem value="entregado">Entregado</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <span className="ml-auto text-sm text-muted-foreground">
        {loading ? "Cargando..." : `${total} operación${total !== 1 ? "es" : ""}`}
      </span>
    </div>
  )
}
