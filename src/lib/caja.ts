import { createClient } from "@/lib/supabase/client"
import type { Caja, CajaSaldo, CajaMovimiento, MovimientoFilters, UsuarioAutorizable } from "@/types/caja"

export const MOVIMIENTOS_PAGE_SIZE = 30

// Saldos SIEMPRE desde la vista cajas_saldos.
// gestorId: filtro EXPLÍCITO para la vista del rol gestor (solo sus cajas);
// no alcanza con confiar en la RLS, que deja ver más de la cuenta.
export async function fetchCajasSaldos(gestorId?: string): Promise<{
  data: CajaSaldo[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  let query = supabase
    .from("cajas_saldos")
    .select("id, nombre, tipo, moneda, gestor_id, saldo")
    .order("nombre")
  if (gestorId) query = query.eq("gestor_id", gestorId)
  const { data, error } = await query
  return { data: (data as CajaSaldo[] | null) ?? [], error }
}

const MOVIMIENTO_SELECT = `id, caja_id, tipo, monto, fecha, concepto, categoria, auto_id, creado_en,
   cajas(nombre, moneda),
   autos(dominio),
   usuario:usuarios!caja_movimientos_creado_por_fkey(nombre, apellido)`

// soloCajas: restringe a esas cajas (vista del gestor); con lista vacía no trae nada
export async function fetchMovimientos(filters: MovimientoFilters, page: number, soloCajas?: string[]) {
  const supabase = createClient()
  let query = supabase
    .from("caja_movimientos")
    .select(MOVIMIENTO_SELECT, { count: "exact" })
    .order("fecha", { ascending: false })
    .order("creado_en", { ascending: false })
    .range(page * MOVIMIENTOS_PAGE_SIZE, (page + 1) * MOVIMIENTOS_PAGE_SIZE - 1)

  if (soloCajas) query = query.in("caja_id", soloCajas)
  if (filters.categoria.trim()) query = query.ilike("categoria", `%${filters.categoria.trim()}%`)
  if (filters.caja_id) query = query.eq("caja_id", filters.caja_id)
  if (filters.tipo) query = query.eq("tipo", filters.tipo)
  if (filters.desde) query = query.gte("fecha", filters.desde)
  if (filters.hasta) query = query.lte("fecha", filters.hasta)
  return query
}

// Saldo corriente (extracto): saldo de la caja DESPUÉS de cada movimiento,
// acumulando en orden cronológico todos los movimientos de esas cajas.
export async function fetchSaldosCorrientes(cajaIds: string[]): Promise<Record<string, number>> {
  if (cajaIds.length === 0) return {}
  const supabase = createClient()
  const { data } = await supabase
    .from("caja_movimientos")
    .select("id, caja_id, tipo, monto")
    .in("caja_id", cajaIds)
    .order("fecha", { ascending: true })
    .order("creado_en", { ascending: true })

  const acumulado: Record<string, number> = {}
  const saldoTras: Record<string, number> = {}
  for (const m of (data as Pick<CajaMovimiento, "id" | "caja_id" | "tipo" | "monto">[] | null) ?? []) {
    acumulado[m.caja_id] = (acumulado[m.caja_id] ?? 0) + (m.tipo === "ingreso" ? m.monto : -m.monto)
    saldoTras[m.id] = acumulado[m.caja_id]
  }
  return saldoTras
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

// Cajas activas que el usuario logueado puede usar.
// La RLS de cajas ya limita la visibilidad (dirección ve todas; el resto,
// solo las autorizadas en caja_usuarios) — sin filtros de agencia a mano.
export async function fetchCajasActivas(): Promise<{
  data: Caja[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("cajas")
    .select("id, nombre, tipo, moneda, gestor_id")
    .eq("activa", true)
    .order("nombre")
  return { data: (data as Caja[] | null) ?? [], error }
}

// ── Autorizaciones por caja (caja_usuarios) ───────────
// Solo dirección administra esto; la RLS limita la agencia (sin filtros a mano).

export async function fetchUsuariosActivos() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido, rol, gestor_id")
    .eq("activo", true)
    .order("nombre")
  return { data: (data as UsuarioAutorizable[] | null) ?? [], error }
}

export async function fetchAutorizaciones(cajaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("caja_usuarios")
    .select("usuario_id")
    .eq("caja_id", cajaId)
  return { data: (data as { usuario_id: string }[] | null) ?? [], error }
}

// INSERT: SOLO caja_id y usuario_id; agencia_id y auditoría los completa el trigger
export async function insertAutorizacion(cajaId: string, usuarioId: string) {
  const supabase = createClient()
  return supabase.from("caja_usuarios").insert({ caja_id: cajaId, usuario_id: usuarioId })
}

export async function deleteAutorizacion(cajaId: string, usuarioId: string) {
  const supabase = createClient()
  return supabase
    .from("caja_usuarios")
    .delete()
    .eq("caja_id", cajaId)
    .eq("usuario_id", usuarioId)
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
