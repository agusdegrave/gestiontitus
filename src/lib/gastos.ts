import { createClient } from "@/lib/supabase/client"
import type { GastoAuto } from "@/types/gastos"

const GASTO_SELECT = "id, auto_id, fecha, concepto, categoria, monto, moneda, creado_en"

export async function fetchGastosAuto(autoId: string): Promise<{
  data: GastoAuto[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("gastos_auto")
    .select(GASTO_SELECT)
    .eq("auto_id", autoId)
    .order("fecha", { ascending: false })
  return { data: (data as GastoAuto[] | null) ?? [], error }
}

// INSERT/UPDATE: NO mandar agencia_id ni auditoría (los completa la base).
export async function insertGastoAuto(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("gastos_auto").insert(payload).select(GASTO_SELECT).single()
}

export async function updateGastoAuto(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("gastos_auto").update(payload).eq("id", id).select(GASTO_SELECT).single()
}

export async function deleteGastoAuto(id: string) {
  const supabase = createClient()
  return supabase.from("gastos_auto").delete().eq("id", id)
}
