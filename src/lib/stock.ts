import { createClient } from "@/lib/supabase/client"
import type { Auto, AutoFilters, UsuarioSimple } from "@/types/stock"

export const PAGE_SIZE = 30

export async function fetchAutos(
  agenciaId: string,
  filters: AutoFilters,
  page: number
) {
  const supabase = createClient()

  let query = supabase
    .from("autos")
    .select(
      `id, tipo, estado, eliminado,
       dominio, marca, modelo, version, anio, km, color,
       combustible, caja, traccion, nro_chasis, nro_motor,
       precio_compra_ars, precio_compra_usd, cotizacion_usd,
       precio_pretendido, precio_publicado, precio_info,
       margen, calificacion_precio, ultima_modif_precio,
       ubicacion, responsable_id, estado_general,
       itv_vence, tiene_gnc, agencia_id,
       creado_por, creado_en, actualizado_por, actualizado_en,
       responsable:usuarios!responsable_id(nombre, apellido)`,
      { count: "exact" }
    )
    .eq("agencia_id", agenciaId)
    .eq("eliminado", false)
    .order("creado_en", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (filters.search.trim()) {
    const s = filters.search.trim()
    const isYear = /^\d{4}$/.test(s)
    let or = `dominio.ilike.%${s}%,marca.ilike.%${s}%,modelo.ilike.%${s}%,version.ilike.%${s}%`
    if (isYear) or += `,anio.eq.${s}`
    query = query.or(or)
  }
  if (filters.tipo && filters.tipo !== "all") query = query.eq("tipo", filters.tipo)
  if (filters.estado && filters.estado !== "all") query = query.eq("estado", filters.estado)
  if (filters.responsable_id && filters.responsable_id !== "all")
    query = query.eq("responsable_id", filters.responsable_id)

  return query
}

export async function fetchUsuariosAgencia(agenciaId: string): Promise<UsuarioSimple[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido")
    .eq("agencia_id", agenciaId)
    .order("nombre")
  return (data as UsuarioSimple[]) ?? []
}

export async function saveAuto(data: Partial<Auto>, editingId?: string) {
  const supabase = createClient()
  if (editingId) {
    return supabase
      .from("autos")
      .update(data)
      .eq("id", editingId)
      .select()
      .single()
  }
  // No mandamos agencia_id ni campos de auditoría: los completa la base por trigger/RLS
  return supabase
    .from("autos")
    .insert(data)
    .select()
    .single()
}

export async function softDeleteAuto(id: string) {
  const supabase = createClient()
  return supabase
    .from("autos")
    .update({ eliminado: true })
    .eq("id", id)
}
