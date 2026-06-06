import { createClient } from "@/lib/supabase/client"
import type { Gestor, GestoriaParametros, Tramite, TramiteFilters } from "@/types/gestoria"

export const TRAMITES_PAGE_SIZE = 30

export async function fetchGestores(): Promise<{ data: Gestor[]; error: { message: string } | null }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("gestores")
    .select("id, nombre, alias, honorario, valor_firma, activo, notas")
    .order("nombre")
  return { data: (data as Gestor[] | null) ?? [], error }
}

// Parámetros de la calculadora: la fila de la agencia (RLS la filtra sola)
export async function fetchParametros(): Promise<GestoriaParametros | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from("gestoria_parametros")
    .select("id, pct_arancel, pct_sellado, pct_base_sellado, pct_prenda, costo_alta_baja, costo_formulario")
    .maybeSingle()
  return (data as GestoriaParametros | null) ?? null
}

// INSERT/UPDATE: NO mandar agencia_id ni auditoría (los completa la base)
export async function saveGestor(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("gestores").insert(payload)
}

export async function updateGestor(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("gestores").update(payload).eq("id", id)
}

export async function deleteGestor(id: string) {
  const supabase = createClient()
  return supabase.from("gestores").delete().eq("id", id)
}

// ── Trámites ─────────────────────────────────────────────

function applyTramiteFilters<T extends { or: (f: string) => T; eq: (c: string, v: string) => T }>(
  query: T,
  filters: TramiteFilters
): T {
  if (filters.search.trim()) {
    const s = filters.search.trim()
    query = query.or(`dominio.ilike.%${s}%,vehiculo.ilike.%${s}%`)
  }
  if (filters.gestor_id) query = query.eq("gestor_id", filters.gestor_id)
  if (filters.estado) query = query.eq("estado", filters.estado)
  return query
}

export async function fetchTramites(filters: TramiteFilters, page: number) {
  const supabase = createClient()
  const query = supabase
    .from("tramites")
    .select("*, gestores(nombre, alias)", { count: "exact" })
    .order("creado_en", { ascending: false })
    .range(page * TRAMITES_PAGE_SIZE, (page + 1) * TRAMITES_PAGE_SIZE - 1)
  return applyTramiteFilters(query, filters)
}

// Totales del filtro actual (todas las páginas): solo las dos ganancias
export async function fetchTramitesTotales(filters: TramiteFilters): Promise<{
  transferencia: number
  deudas: number
}> {
  const supabase = createClient()
  const query = supabase.from("tramites").select("ganancia_transferencia, ganancia_deudas")
  const { data } = await applyTramiteFilters(query, filters)
  const rows = (data as Pick<Tramite, "ganancia_transferencia" | "ganancia_deudas">[] | null) ?? []
  return {
    transferencia: rows.reduce((acc, r) => acc + (r.ganancia_transferencia ?? 0), 0),
    deudas: rows.reduce((acc, r) => acc + (r.ganancia_deudas ?? 0), 0),
  }
}

// INSERT/UPDATE: NO mandar ganancia_transferencia ni ganancia_deudas (las calcula
// la base), ni agencia_id ni auditoría (los completa la base).
export async function saveTramite(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("tramites").insert(payload)
}

export async function updateTramite(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("tramites").update(payload).eq("id", id)
}

export async function deleteTramite(id: string) {
  const supabase = createClient()
  return supabase.from("tramites").delete().eq("id", id)
}
