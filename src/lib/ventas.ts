import { createClient } from "@/lib/supabase/client"
import type { Venta, VentaFilters, Tarea } from "@/types/ventas"

export const PAGE_SIZE = 30

export async function fetchVentas(filters: VentaFilters, page: number) {
  const supabase = createClient()

  let query = supabase
    .from("ventas")
    .select(
      `id, auto_id, auto_entrega_id, estado_operacion,
       fecha_senia, senia, lugar_senia,
       vendedor_id, procedencia, precio_venta,
       paga_contado, paga_permuta, paga_financiado,
       financiera, cantidad_cuotas, costo_prenda,
       comprador_nombre, comprador_apellido, comprador_dni,
       comprador_domicilio, comprador_telefono, creado_en,
       autos!ventas_auto_id_fkey(dominio, marca, modelo, anio),
       vendedor:usuarios!ventas_vendedor_id_fkey(nombre, apellido)`,
      { count: "exact" }
    )
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

  if (filters.estado_operacion && filters.estado_operacion !== "all") {
    query = query.eq("estado_operacion", filters.estado_operacion)
  }

  return query
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
  const r = row as Venta & { autos: unknown; vendedor: unknown }
  return {
    ...r,
    autos: Array.isArray(r.autos) ? (r.autos[0] ?? null) : (r.autos as Venta["autos"]),
    vendedor: Array.isArray(r.vendedor) ? (r.vendedor[0] ?? null) : (r.vendedor as Venta["vendedor"]),
  }
}
