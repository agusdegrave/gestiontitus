import { createClient } from "@/lib/supabase/client"
import type { Venta, VentaFilters, Tarea, Financiacion, OperacionItem } from "@/types/ventas"
import type { Verificacion, Informe } from "@/types/consignacion"

export const PAGE_SIZE = 30

// Select para la lista de tarjetas: sin auto_entrega ni textos de seguimiento.
// Un error en cualquier embed tira la query entera, así que la lista
// solo embebe lo imprescindible (auto, vendedor y financiacion, con FK explícito).
// financiacion va embebida para calcular el progreso global sin N+1.
const VENTA_LIST_SELECT = `id, auto_id, auto_entrega_id, estado_operacion,
   fecha_senia, senia, vendedor_id, precio_venta,
   paga_contado, paga_permuta, paga_financiado, financiera,
   fecha_tentativa_entrega, fecha_entrega,
   comprador_nombre, comprador_apellido, creado_en,
   entrega_planilla_ok, entrega_checklist_ok, entrega_08_ok,
   entrega_veri_ok, entrega_seguro_ok, entrega_control_ok, entrega_legajo_ok,
   deuda_muni, deuda_rentas, deuda_multas, gastos_consigna,
   deuda_permuta_muni, deuda_permuta_rentas, deuda_permuta_multas,
   autos!ventas_auto_id_fkey(dominio, marca, modelo, anio, tipo),
   vendedor:usuarios!ventas_vendedor_id_fkey(nombre, apellido),
   financiacion(*)`

// Select completo solo para la FICHA (detalle)
const VENTA_DETAIL_SELECT = `*,
   autos!ventas_auto_id_fkey(dominio, marca, modelo, anio, estado, tipo),
   vendedor:usuarios!ventas_vendedor_id_fkey(nombre, apellido),
   auto_entrega:autos!ventas_auto_entrega_id_fkey(dominio, marca, modelo)`

export async function fetchVentas(filters: VentaFilters, page: number) {
  const supabase = createClient()

  let query = supabase
    .from("ventas")
    .select(VENTA_LIST_SELECT, { count: "exact" })
    .order("creado_en", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (filters.search.trim()) {
    const s = filters.search.trim()
    const { data: autoData } = await supabase
      .from("autos")
      .select("id")
      .ilike("dominio", `%${s}%`)
    const autoIds = autoData?.map((a) => a.id) ?? []

    if (autoIds.length > 0) {
      query = query.or(
        `auto_id.in.(${autoIds.join(",")}),comprador_nombre.ilike.%${s}%,comprador_apellido.ilike.%${s}%`
      )
    } else {
      query = query.or(
        `comprador_nombre.ilike.%${s}%,comprador_apellido.ilike.%${s}%`
      )
    }
  }

  // "en_curso" (default): la lista principal es para ventas en curso;
  // las entregadas se ven con el filtro Entregadas o Todas.
  if (!filters.estado_operacion || filters.estado_operacion === "en_curso") {
    query = query.in("estado_operacion", ["senado", "en_proceso"])
  } else if (filters.estado_operacion !== "all") {
    query = query.eq("estado_operacion", filters.estado_operacion)
  }

  return query
}

export async function fetchVentaById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("ventas")
    .select(VENTA_DETAIL_SELECT)
    .eq("id", id)
    .single()

  if (error || !data) return { data: null, error }
  return { data: normalizeVenta(data), error: null }
}

// Verificación e informes del auto vendido (solo lectura en la ficha de operación)
export async function fetchSeguimientoAuto(autoId: string): Promise<{
  verificacion: Verificacion | null
  informes: Informe[]
}> {
  const supabase = createClient()
  const [verifRes, infRes] = await Promise.all([
    supabase.from("verificacion").select("*").eq("auto_id", autoId).maybeSingle(),
    supabase.from("informes").select("*").eq("auto_id", autoId).order("tipo"),
  ])
  return {
    verificacion: (verifRes.data as Verificacion | null) ?? null,
    informes: (infRes.data as Informe[] | null) ?? [],
  }
}

// Financiación de la venta (1 fila por venta; puede no existir todavía)
export async function fetchFinanciacion(ventaId: string): Promise<Financiacion | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from("financiacion")
    .select("*")
    .eq("venta_id", ventaId)
    .maybeSingle()
  return (data as Financiacion | null) ?? null
}

// UPSERT por venta_id: insert si no existe, update si existe.
// NO mandar agencia_id ni auditoría (los completa la base).
export async function upsertFinanciacion(ventaId: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase
    .from("financiacion")
    .upsert({ venta_id: ventaId, ...payload }, { onConflict: "venta_id" })
}

// ── Ítems libres del estado de cuenta (card Números) ─────
// INSERT/UPDATE: NO mandar agencia_id ni auditoría (los completa la base).

export async function fetchOperacionItems(ventaId: string): Promise<{
  data: OperacionItem[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("operacion_items")
    .select("id, venta_id, concepto, monto, signo, bloque")
    .eq("venta_id", ventaId)
    .order("creado_en", { ascending: true })
  return { data: (data as OperacionItem[] | null) ?? [], error }
}

export async function insertOperacionItem(payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase
    .from("operacion_items")
    .insert(payload)
    .select("id, venta_id, concepto, monto, signo, bloque")
    .single()
}

export async function updateOperacionItem(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("operacion_items").update(payload).eq("id", id)
}

export async function deleteOperacionItem(id: string) {
  const supabase = createClient()
  return supabase.from("operacion_items").delete().eq("id", id)
}

// UPDATE de seguimiento: NO mandar agencia_id ni auditoría (los completa la base).
// Al pasar estado_operacion a 'entregado' un trigger marca el auto como 'vendido'.
export async function updateVenta(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("ventas").update(payload).eq("id", id)
}

interface PermutaPayload {
  dominio: string
  marca: string
  modelo: string
  version: string | null
  anio: number | null
  km: number | null
  color: string | null
  combustible: string | null
  precio_compra_ars: number | null
}

interface VentaPayload {
  auto_id: string
  auto_entrega_id?: string | null
  estado_operacion: string
  fecha_senia: string
  senia: number | null
  lugar_senia: string | null
  vendedor_id: string
  procedencia: string | null
  precio_venta: number | null
  paga_contado: number | null
  paga_permuta: number | null
  paga_financiado: number | null
  financiera: string | null
  cantidad_cuotas: number | null
  costo_prenda: number | null
  comprador_nombre: string
  comprador_apellido: string
  comprador_dni: string | null
  comprador_domicilio: string | null
  comprador_telefono: string | null
}

export async function saveVenta(
  ventaPayload: VentaPayload,
  permutaPayload: PermutaPayload | null
): Promise<{ error: { message: string } | null }> {
  const supabase = createClient()

  let autoEntregaId: string | null = null

  // Paso a: si hay permuta, insertar el usado
  if (permutaPayload) {
    const { data: usado, error: usadoError } = await supabase
      .from("autos")
      .insert({
        ...permutaPayload,
        tipo: "propio",
        estado: "por_ingresar",
        eliminado: false,
      })
      .select("id")
      .single()

    if (usadoError || !usado) {
      return { error: usadoError ?? { message: "No se pudo crear el auto de permuta." } }
    }
    autoEntregaId = usado.id
  }

  // Paso b: insertar venta
  const { error: ventaError } = await supabase.from("ventas").insert({
    ...ventaPayload,
    auto_entrega_id: autoEntregaId,
    estado_operacion: "senado",
  })

  if (ventaError) {
    // Paso c: si falló la venta y habíamos creado el usado, borrarlo
    if (autoEntregaId) {
      await supabase.from("autos").delete().eq("id", autoEntregaId)
    }
    return { error: ventaError }
  }

  return { error: null }
}

export async function fetchTareas(): Promise<Tarea[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("tareas")
    .select("id, titulo, descripcion, estado, auto_id, creado_en, autos(dominio, marca, modelo)")
    .eq("estado", "pendiente")
    .order("creado_en", { ascending: true })
  return (data as unknown as Tarea[]) ?? []
}

export async function completarTarea(id: string) {
  const supabase = createClient()
  return supabase.from("tareas").update({ estado: "hecha" }).eq("id", id)
}

export function normalizeVenta(row: unknown): Venta {
  const r = row as Venta & { autos: unknown; vendedor: unknown; auto_entrega: unknown; financiacion: unknown }
  return {
    ...r,
    autos: Array.isArray(r.autos) ? (r.autos[0] ?? null) : (r.autos as Venta["autos"]),
    vendedor: Array.isArray(r.vendedor) ? (r.vendedor[0] ?? null) : (r.vendedor as Venta["vendedor"]),
    auto_entrega: Array.isArray(r.auto_entrega) ? (r.auto_entrega[0] ?? null) : (r.auto_entrega as Venta["auto_entrega"]),
    financiacion: Array.isArray(r.financiacion) ? (r.financiacion[0] ?? null) : (r.financiacion as Venta["financiacion"]),
  }
}
