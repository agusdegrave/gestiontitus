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
import type { AutoFilters, UsuarioSimple } from "@/types/stock"

interface Props {
  filters: AutoFilters
  usuarios: UsuarioSimple[]
  total: number
  loading: boolean
  onChange: (filters: AutoFilters) => void
}

export function StockFilters({ filters, usuarios, total, loading, onChange }: Props) {
  const set = (field: keyof AutoFilters) => (val: string | null) =>
    onChange({ ...filters, [field]: val ?? "" })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={filters.search}
          onChange={(e) => set("search")(e.target.value)}
          placeholder="Buscar dominio, marca, modelo..."
          className="pl-8 h-9 rounded-[10px] bg-white"
        />
      </div>

      {/* Tipo */}
      <Select value={filters.tipo || "all"} onValueChange={(v) => set("tipo")(v === "all" ? "" : v)}>
        <SelectTrigger className="w-36 h-9 rounded-[10px] bg-white">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="propio">Propio</SelectItem>
          <SelectItem value="consigna">Consigna</SelectItem>
        </SelectContent>
      </Select>

      {/* Estado */}
      <Select value={filters.estado || "all"} onValueChange={(v) => set("estado")(v === "all" ? "" : v)}>
        <SelectTrigger className="w-40 h-9 rounded-[10px] bg-white">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="por_ingresar">Por ingresar</SelectItem>
          <SelectItem value="en_alistaje">En alistaje</SelectItem>
          <SelectItem value="activo">Activo</SelectItem>
          <SelectItem value="senado">Señado</SelectItem>
          <SelectItem value="vendido">Vendido</SelectItem>
        </SelectContent>
      </Select>

      {/* Responsable */}
      {usuarios.length > 0 && (
        <Select value={filters.responsable_id || "all"} onValueChange={(v) => set("responsable_id")(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44 h-9 rounded-[10px] bg-white">
            <SelectValue placeholder="Responsable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombre} {u.apellido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Contador */}
      {!loading && (
        <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
          {total} {total === 1 ? "auto" : "autos"}
        </span>
      )}
    </div>
  )
}
