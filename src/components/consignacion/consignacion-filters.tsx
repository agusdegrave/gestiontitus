"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ConsignacionFilters } from "@/types/consignacion"

interface Props {
  filters: ConsignacionFilters
  total: number
  loading: boolean
  onChange: (f: ConsignacionFilters) => void
}

export function ConsignacionFiltersBar({ filters, total, loading, onChange }: Props) {
  const set = (field: keyof ConsignacionFilters) => (val: string | null) =>
    onChange({ ...filters, [field]: val ?? "" })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={filters.search}
          onChange={(e) => set("search")(e.target.value)}
          placeholder="Buscar dominio, marca, dueño..."
          className="pl-8 h-9 rounded-[10px] bg-white"
        />
      </div>

      <Select
        value={filters.tipoConsigna || "all"}
        onValueChange={(v) => set("tipoConsigna")(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-36 h-9 rounded-[10px] bg-white">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="fisica">Física</SelectItem>
          <SelectItem value="virtual">Virtual</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.estadoVerif || "all"}
        onValueChange={(v) => set("estadoVerif")(v === "all" ? "" : v)}
      >
        <SelectTrigger className="w-44 h-9 rounded-[10px] bg-white">
          <SelectValue placeholder="Verificación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda verificación</SelectItem>
          <SelectItem value="pendiente">Pendiente</SelectItem>
          <SelectItem value="turno_sacado">Turno sacado</SelectItem>
          <SelectItem value="hecha">Hecha</SelectItem>
          <SelectItem value="observada">Observada</SelectItem>
        </SelectContent>
      </Select>

      {!loading && (
        <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
          {total} {total === 1 ? "consigna" : "consignas"}
        </span>
      )}
    </div>
  )
}
