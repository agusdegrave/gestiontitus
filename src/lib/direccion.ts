import { createClient } from "@/lib/supabase/client"
import type {
  RentabilidadAuto,
  ParticipacionSocio,
  AutoConParticipacion,
  Sueldo,
  VentaComision,
} from "@/types/direccion"

// ── Rentabilidad ──────────────────────────────────────

export async function fetchRentabilidad(): Promise<{
  data: RentabilidadAuto[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("rentabilidad_auto")
    .select("auto_id, dominio, marca, modelo, anio, tipo, precio_venta, precio_compra, gastos_ars, comision, ganancia")
    .order("dominio")
  return { data: (data as RentabilidadAuto[] | null) ?? [], error }
}

export async function fetchRentabilidadAuto(autoId: string): Promise<{
  data: RentabilidadAuto | null
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("rentabilidad_auto")
    .select("auto_id, dominio, marca, modelo, anio, tipo, precio_venta, precio_compra, gastos_ars, comision, ganancia")
    .eq("auto_id", autoId)
    .maybeSingle()
  return { data: (data as RentabilidadAuto | null) ?? null, error }
}

// ── Socios ────────────────────────────────────────────

// Autos propios que tienen participación cargada (dedupe por auto)
export async function fetchAutosConParticipacion(): Promise<{
  data: AutoConParticipacion[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("participacion_auto")
    .select("auto_id, autos(dominio, marca, modelo, anio)")
  if (error) return { data: [], error }

  const map = new Map<string, AutoConParticipacion>()
  for (const row of (data ?? []) as unknown as {
    auto_id: string
    autos: { dominio: string; marca: string | null; modelo: string | null; anio: number | null } | null
  }[]) {
    if (!row.autos || map.has(row.auto_id)) continue
    map.set(row.auto_id, { auto_id: row.auto_id, ...row.autos })
  }
  return {
    data: [...map.values()].sort((a, b) => a.dominio.localeCompare(b.dominio)),
    error: null,
  }
}

export async function fetchParticipaciones(autoId: string): Promise<{
  data: ParticipacionSocio[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("participacion_auto")
    .select("id, auto_id, socio_id, porcentaje, capital_aportado, moneda, socios(nombre, apellido)")
    .eq("auto_id", autoId)
    .order("porcentaje", { ascending: false })
  if (error) return { data: [], error }
  // El embed puede venir como array según la relación detectada
  const rows = ((data ?? []) as unknown as (ParticipacionSocio & { socios: unknown })[]).map((r) => ({
    ...r,
    socios: Array.isArray(r.socios) ? (r.socios[0] ?? null) : (r.socios as ParticipacionSocio["socios"]),
  }))
  return { data: rows, error: null }
}

// ── Comisiones ────────────────────────────────────────

// Ventas con fecha_senia dentro del mes (year: 2026, month: 1-12)
export async function fetchVentasDelMes(year: number, month: number): Promise<{
  data: VentaComision[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const desde = `${year}-${String(month).padStart(2, "0")}-01`
  const hastaDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`

  const { data, error } = await supabase
    .from("ventas")
    .select(`id, vendedor_id, fecha_senia, comision_base, margen_disponible, margen_usado,
       autos!ventas_auto_id_fkey(dominio, marca, modelo),
       vendedor:usuarios!ventas_vendedor_id_fkey(nombre, apellido)`)
    .gte("fecha_senia", desde)
    .lt("fecha_senia", hastaDate)
    .order("fecha_senia")
  if (error) return { data: [], error }

  const rows = ((data ?? []) as unknown as (VentaComision & { autos: unknown; vendedor: unknown })[]).map((r) => ({
    ...r,
    autos: Array.isArray(r.autos) ? (r.autos[0] ?? null) : (r.autos as VentaComision["autos"]),
    vendedor: Array.isArray(r.vendedor) ? (r.vendedor[0] ?? null) : (r.vendedor as VentaComision["vendedor"]),
  }))
  return { data: rows, error: null }
}

// ── Sueldos ───────────────────────────────────────────

const SUELDO_SELECT = `id, usuario_id, nombre_libre, tipo, monto, moneda, fecha, concepto, creado_en,
   usuario:usuarios!sueldos_usuario_id_fkey(nombre, apellido)`

// mes: "YYYY-MM" o "" (todos)
export async function fetchSueldos(mes: string): Promise<{
  data: Sueldo[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  let query = supabase
    .from("sueldos")
    .select(SUELDO_SELECT)
    .order("fecha", { ascending: false })

  if (mes) {
    const [y, m] = mes.split("-").map(Number)
    const desde = `${y}-${String(m).padStart(2, "0")}-01`
    const hasta = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`
    query = query.gte("fecha", desde).lt("fecha", hasta)
  }

  const { data, error } = await query
  if (error) return { data: [], error }
  const rows = ((data ?? []) as unknown as (Sueldo & { usuario: unknown })[]).map((r) => ({
    ...r,
    usuario: Array.isArray(r.usuario) ? (r.usuario[0] ?? null) : (r.usuario as Sueldo["usuario"]),
  }))
  return { data: rows, error: null }
}

// INSERT/UPDATE: NO mandar agencia_id ni auditoría (los completa la base).
export async function insertSueldo(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("sueldos").insert(payload)
}

export async function updateSueldo(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("sueldos").update(payload).eq("id", id)
}

export async function deleteSueldo(id: string) {
  const supabase = createClient()
  return supabase.from("sueldos").delete().eq("id", id)
}
