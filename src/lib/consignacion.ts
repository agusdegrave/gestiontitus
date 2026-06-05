import { createClient } from "@/lib/supabase/client"
import type {
  ConsignacionRow,
  ConsignacionFilters,
  Consignacion,
  Verificacion,
  Informe,
} from "@/types/consignacion"
import { PAGE_SIZE } from "./stock"
export { PAGE_SIZE }

function normalizeRow(row: unknown): ConsignacionRow {
  const r = row as ConsignacionRow & {
    consignacion: unknown
    verificacion: unknown
    informes: unknown
  }
  return {
    ...r,
    consignacion: Array.isArray(r.consignacion) ? (r.consignacion[0] ?? null) : (r.consignacion as Consignacion | null),
    verificacion: Array.isArray(r.verificacion) ? (r.verificacion[0] ?? null) : (r.verificacion as Verificacion | null),
    informes: Array.isArray(r.informes) ? (r.informes as Informe[]) : [],
  } as ConsignacionRow
}

export async function fetchConsignaciones(
  agenciaId: string,
  filters: ConsignacionFilters,
  page: number
) {
  const supabase = createClient()
  const idSets: string[][] = []

  if (filters.search.trim()) {
    const s = filters.search.trim()
    const [autoRes, consignaRes] = await Promise.all([
      supabase
        .from("autos")
        .select("id")
        .eq("tipo", "consigna")
        .eq("agencia_id", agenciaId)
        .or(`dominio.ilike.%${s}%,marca.ilike.%${s}%,modelo.ilike.%${s}%`),
      supabase
        .from("consignacion")
        .select("auto_id")
        .or(`duenio_nombre.ilike.%${s}%,duenio_apellido.ilike.%${s}%`),
    ])
    const ids = [
      ...new Set([
        ...(autoRes.data?.map((r) => r.id) ?? []),
        ...(consignaRes.data?.map((r) => r.auto_id) ?? []),
      ]),
    ]
    idSets.push(ids)
  }

  if (filters.tipoConsigna && filters.tipoConsigna !== "all") {
    const { data } = await supabase
      .from("consignacion")
      .select("auto_id")
      .eq("tipo", filters.tipoConsigna)
    idSets.push(data?.map((r) => r.auto_id) ?? [])
  }

  if (filters.estadoVerif && filters.estadoVerif !== "all") {
    const { data } = await supabase
      .from("verificacion")
      .select("auto_id")
      .eq("estado", filters.estadoVerif)
    idSets.push(data?.map((r) => r.auto_id) ?? [])
  }

  let filterIds: string[] | null = null
  if (idSets.length > 0) {
    filterIds = idSets.reduce((acc, set) => {
      const s = new Set(set)
      return acc.filter((id) => s.has(id))
    })
    if (filterIds.length === 0) return { data: [], count: 0, error: null }
  }

  let query = supabase
    .from("autos")
    .select("*, consignacion(*), verificacion(*), informes(*)", { count: "exact" })
    .eq("tipo", "consigna")
    .eq("eliminado", false)
    .eq("agencia_id", agenciaId)
    .order("creado_en", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (filterIds) query = query.in("id", filterIds)

  const result = await query
  return {
    ...result,
    data: result.data?.map(normalizeRow) ?? [],
  }
}

export async function fetchConsignacionById(autoId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("autos")
    .select("*, consignacion(*), verificacion(*), informes(*)")
    .eq("id", autoId)
    .single()

  if (error || !data) return { data: null, error }
  return { data: normalizeRow(data), error: null }
}

export async function updateAuto(autoId: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("autos").update(payload).eq("id", autoId)
}

export async function updateConsignacionRecord(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("consignacion").update(payload).eq("id", id)
}

export async function updateVerificacion(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("verificacion").update(payload).eq("id", id)
}

export async function updateInforme(id: string, payload: Record<string, unknown>) {
  const supabase = createClient()
  return supabase.from("informes").update(payload).eq("id", id)
}
