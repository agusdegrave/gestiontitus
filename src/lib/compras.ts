import { createClient } from "@/lib/supabase/client"
import type {
  Socio,
  CompraRow,
  ComprasFilters,
  AutoCompra,
  OrigenCompra,
  ParticipacionInput,
  Participacion,
} from "@/types/compras"

export const PAGE_SIZE = 30

/* ── Socios ──────────────────────────────────────── */

export async function fetchSocios(search: string) {
  const supabase = createClient()
  let query = supabase.from("socios").select("*").order("nombre")
  if (search.trim()) {
    const s = search.trim()
    query = query.or(`nombre.ilike.%${s}%,apellido.ilike.%${s}%`)
  }
  return query
}

export async function fetchSociosActivos(): Promise<Socio[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("socios")
    .select("*")
    .eq("activo", true)
    .order("nombre")
  return (data as Socio[]) ?? []
}

export async function saveSocio(
  payload: Record<string, unknown>,
  editingId?: string
) {
  const supabase = createClient()
  // No mandamos agencia_id ni auditoría: los completa la base
  if (editingId) {
    return supabase.from("socios").update(payload).eq("id", editingId).select().single()
  }
  return supabase.from("socios").insert(payload).select().single()
}

export async function deleteSocio(id: string) {
  const supabase = createClient()
  return supabase.from("socios").delete().eq("id", id)
}

/* ── Autos para el form ──────────────────────────── */

const AUTO_COMPRA_FIELDS =
  "id, dominio, marca, modelo, anio, km, color, precio_compra_ars, precio_pretendido"

/** Autos propios sin compra registrada (típicamente entrados por permuta) */
export async function fetchPendientes(): Promise<{
  data: AutoCompra[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("autos")
    .select(`${AUTO_COMPRA_FIELDS}, compras!compras_auto_id_fkey(id)`)
    .eq("tipo", "propio")
    .eq("eliminado", false)
    .order("creado_en", { ascending: false })

  if (error) return { data: [], error }

  const pendientes = ((data as unknown[]) ?? []).filter((row) => {
    const compras = (row as { compras?: unknown }).compras
    return !compras || (Array.isArray(compras) && compras.length === 0)
  })
  return { data: pendientes as unknown as AutoCompra[], error: null }
}

/** Autos en consigna (activos) que la agencia puede comprarle al dueño */
export async function fetchAutosConsigna(): Promise<{
  data: AutoCompra[]
  error: { message: string } | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("autos")
    .select(AUTO_COMPRA_FIELDS)
    .eq("tipo", "consigna")
    .eq("eliminado", false)
    .neq("estado", "vendido")
    .order("dominio")
  return { data: (data as AutoCompra[]) ?? [], error }
}

/* ── Compras ─────────────────────────────────────── */

export function normalizeCompra(row: unknown): CompraRow {
  const r = row as CompraRow & { autos: unknown; participacion_auto: unknown }
  const participaciones = Array.isArray(r.participacion_auto)
    ? (r.participacion_auto as Participacion[])
    : []
  return {
    ...r,
    autos: Array.isArray(r.autos) ? (r.autos[0] ?? null) : (r.autos as CompraRow["autos"]),
    participacion_auto: participaciones.map((p) => ({
      ...p,
      socios: Array.isArray(p.socios) ? (p.socios[0] ?? null) : p.socios,
    })),
  }
}

export async function fetchCompras(filters: ComprasFilters, page: number) {
  const supabase = createClient()

  let query = supabase
    .from("compras")
    .select(
      "*, autos!compras_auto_id_fkey(dominio,marca,modelo,anio), participacion_auto(*, socios(nombre,apellido))",
      { count: "exact" }
    )
    .order("fecha_compra", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (filters.search.trim()) {
    const s = filters.search.trim()
    const { data: autosData } = await supabase
      .from("autos")
      .select("id")
      .ilike("dominio", `%${s}%`)
    const ids = autosData?.map((a) => a.id) ?? []
    if (ids.length === 0) return { data: [], count: 0, error: null }
    query = query.in("auto_id", ids)
  }

  if (filters.origen && filters.origen !== "all") {
    query = query.eq("origen", filters.origen)
  }

  const result = await query
  return {
    ...result,
    data: ((result.data as unknown[]) ?? []).map(normalizeCompra),
  }
}

export async function saveCompra(params: {
  origen: OrigenCompra
  autoId: string | null
  autoPayload: Record<string, unknown> | null
  compraPayload: Record<string, unknown>
  participaciones: ParticipacionInput[]
}): Promise<{ error: { message: string } | null }> {
  const supabase = createClient()
  let autoId = params.autoId
  let createdAutoId: string | null = null

  // a. Origen 'calle': crear el auto nuevo. La base completa agencia_id y auditoría.
  if (params.origen === "calle") {
    const { data: auto, error: autoError } = await supabase
      .from("autos")
      .insert({
        ...params.autoPayload,
        tipo: "propio",
        estado: "en_alistaje",
        eliminado: false,
      })
      .select("id")
      .single()

    if (autoError || !auto) {
      return { error: autoError ?? { message: "No se pudo crear el auto." } }
    }
    autoId = auto.id
    createdAutoId = auto.id
  }

  if (!autoId) return { error: { message: "No se seleccionó ningún auto." } }

  // b. Insertar la compra
  const { data: compra, error: compraError } = await supabase
    .from("compras")
    .insert({ auto_id: autoId, origen: params.origen, ...params.compraPayload })
    .select("id")
    .single()

  if (compraError || !compra) {
    // d. Rollback del auto creado en (a)
    if (createdAutoId) await supabase.from("autos").delete().eq("id", createdAutoId)
    return { error: compraError ?? { message: "No se pudo registrar la compra." } }
  }

  // c. Insertar participaciones
  if (params.participaciones.length > 0) {
    const rows = params.participaciones.map((p) => ({ auto_id: autoId, ...p }))
    const { error: partError } = await supabase.from("participacion_auto").insert(rows)

    if (partError) {
      // d. Rollback de la compra (y del auto si lo creamos acá)
      await supabase.from("compras").delete().eq("id", compra.id)
      if (createdAutoId) await supabase.from("autos").delete().eq("id", createdAutoId)
      return { error: partError }
    }
  }

  // e. Estado del auto, sync de precios y tarea de permuta: los resuelve la base por trigger.
  return { error: null }
}

export async function deleteCompra(compraId: string, autoId: string) {
  const supabase = createClient()
  const { error: partError } = await supabase
    .from("participacion_auto")
    .delete()
    .eq("auto_id", autoId)
  if (partError) return { error: partError }
  return supabase.from("compras").delete().eq("id", compraId)
}
