import { createClient } from "@/lib/supabase/client"
import type { Gestor, GestoriaParametros } from "@/types/gestoria"

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
