import { createClient } from "@/lib/supabase/client"
import type { CajaSaldo, CajaMovimiento, MovimientoFilters } from "@/types/caja"

export const MOVIMIENTOS_PAGE_SIZE = 30

// Saldos SIEMPRE desde la vista cajas_saldos (la RLS filtra lo visible por rol)
export async function fetchCajasSaldos(): Promise<{
  data: CajaSaldo[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("cajas_saldos")
    .select("id, nombre, tipo, moneda, gestor_id, saldo")
    .order("nombre")
  return { data: (data as CajaSaldo[] | null) ?? [], error }
}

const MOVIMIENTO_SELECT = `id, caja_id, tipo, monto, fecha, concepto, categoria, auto_id, creado_en,
   cajas(nombre, moneda),
   autos(dominio),
   usuario:usuarios!caja_movimientos_creado_por_fkey(nombre, apellido)`

export async function fetchMovimientos(filters: MovimientoFilters, page: number) {
  const supabase = createClient()
  let query = supabase
    .from("caja_movimientos")
    .select(MOVIMIENTO_SELECT, { count: "exact" })
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false })
    .range(page * MOVIMIENTOS_PAGE_SIZE, (page + 1) * MOVIMIENTOS_PAGE_SIZE - 1)

  if (filters.categoria.trim()) query = query.ilike("categoria", `%${filters.categoria.trim()}%`)
  if (filters.caja_id) query = query.eq("caja_id", filters.caja_id)
  if (filters.tipo) query = query.eq("tipo", filters.tipo)
  if (filters.desde) query = query.gte("fecha", filters.desde)
  if (filters.hasta) query = query.lte("fecha", filters.hasta)
  return query
}

// Ingresos/Egresos de hoy por moneda (la RLS limita a las cajas visibles)
export async function fetchTotalesHoy(): Promise<{
  ingresos: { ARS: number; USD: number }
  egresos: { ARS: number; USD: number }
}> {
  const supabase = createClient()
  const hoy = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from("caja_movimientos")
    .select("tipo, monto, cajas!inner(moneda)")
    .eq("fecha", hoy)

  const totales = {
    ingresos: { ARS: 0, USD: 0 },
    egresos: { ARS: 0, USD: 0 },
  }
  for (const row of (data as unknown as Pick<CajaMovimiento, "tipo" | "monto" | "cajas">[] | null) ?? []) {
    const caja = Array.isArray(row.cajas) ? row.cajas[0] : row.cajas
    const moneda = caja?.moneda === "USD" ? "USD" : "ARS"
    totales[row.tipo === "ingreso" ? "ingresos" : "egresos"][moneda] += row.monto ?? 0
  }
  return totales
}

// INSERT/UPDATE: NO mandar agencia_id ni auditoría (los completa la base)
export async function saveCaja(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("cajas").insert(payload)
}

export async function updateCaja(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("cajas").update(payload).eq("id", id)
}

// OJO: borra también sus movimientos (la base lo hace en cascada)
export async function deleteCaja(id: string) {
  const supabase = createClient()
  return supabase.from("cajas").delete().eq("id", id)
}

export async function saveMovimiento(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("caja_movimientos").insert(payload)
}

// Crea las dos patas (egreso origen + ingreso destino) con categoría 'transferencia'
export async function transferir(params: {
  origen: string
  destino: string
  monto: number
  fecha: string
  concepto: string
}) {
  const supabase = createClient()
  return supabase.rpc("caja_transferir", {
    p_origen: params.origen,
    p_destino: params.destino,
    p_monto: params.monto,
    p_fecha: params.fecha,
    p_concepto: params.concepto,
  })
}

// Autos para asociar a un movimiento (lista liviana)
export async function fetchAutosSimple(): Promise<
  { id: string; dominio: string; marca: string; modelo: string }[]
> {
  const supabase = createClient()
  const { data } = await supabase
    .from("autos")
    .select("id, dominio, marca, modelo")
    .eq("eliminado", false)
    .order("dominio")
  return (data as { id: string; dominio: string; marca: string; modelo: string }[] | null) ?? []
}
