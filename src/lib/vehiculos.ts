import { createClient } from "@/lib/supabase/client"
import type { Socio, CreateVehiculoParams } from "@/types/vehiculos"

export async function fetchSociosActivos(): Promise<Socio[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("socios")
    .select("id, nombre, apellido, activo")
    .eq("activo", true)
    .order("nombre")
  return (data as Socio[]) ?? []
}

/**
 * Crea el vehículo completo en el orden exacto:
 * 1. autos (la base crea por trigger verificación + informes en 'pendiente')
 * 2. consignacion (si tipo=consigna)
 * 3. update de verificacion/informes (solo si vienen datos)
 * 4. participacion_auto (si tipo=propio), creando socios nuevos al vuelo
 * 5. si algo falla después de (1), se borra el auto (delete por id) y se
 *    devuelve el error real de Supabase.
 */
export async function createVehiculo(
  params: CreateVehiculoParams
): Promise<{ error: { message: string } | null; autoId?: string }> {
  const supabase = createClient()

  // 1. Auto. No mandamos agencia_id ni auditoría: los completa la base.
  const { data: auto, error: autoError } = await supabase
    .from("autos")
    .insert(params.autoPayload)
    .select("id")
    .single()

  if (autoError || !auto) {
    return { error: autoError ?? { message: "No se pudo crear el auto." } }
  }
  const autoId = auto.id as string

  const rollback = async () => {
    await supabase.from("autos").delete().eq("id", autoId)
  }

  // 2. Consignación
  if (params.consignacionPayload) {
    const { error: consigError } = await supabase
      .from("consignacion")
      .insert({ ...params.consignacionPayload, auto_id: autoId })
    if (consigError) {
      await rollback()
      return { error: consigError }
    }
  }

  // 3. Verificación e informes: los stubs ya los creó el trigger; solo update
  if (params.verificacionUpdate) {
    const { error: verifError } = await supabase
      .from("verificacion")
      .update(params.verificacionUpdate)
      .eq("auto_id", autoId)
    if (verifError) {
      await rollback()
      return { error: verifError }
    }
  }

  if (params.informesUpdate) {
    for (const tipo of ["dominio", "multas"] as const) {
      const estado = params.informesUpdate[tipo]
      if (estado === "pendiente") continue
      const { error: infError } = await supabase
        .from("informes")
        .update({ estado })
        .eq("auto_id", autoId)
        .eq("tipo", tipo)
      if (infError) {
        await rollback()
        return { error: infError }
      }
    }
  }

  // 4. Inversores (solo propio)
  if (params.inversores.length > 0) {
    const filas: Record<string, unknown>[] = []
    for (const inv of params.inversores) {
      let socioId = inv.socio_id
      if (!socioId && inv.nombre_nuevo) {
        // Crear el socio al vuelo
        const { data: socio, error: socioError } = await supabase
          .from("socios")
          .insert({ nombre: inv.nombre_nuevo, activo: true })
          .select("id")
          .single()
        if (socioError || !socio) {
          await rollback()
          return { error: socioError ?? { message: "No se pudo crear el inversor." } }
        }
        socioId = socio.id as string
      }
      if (!socioId) continue
      filas.push({
        auto_id: autoId,
        socio_id: socioId,
        porcentaje: inv.porcentaje,
        capital_aportado: inv.capital_aportado,
        moneda: inv.moneda,
      })
    }

    if (filas.length > 0) {
      const { error: partError } = await supabase
        .from("participacion_auto")
        .insert(filas)
      if (partError) {
        await rollback()
        return { error: partError }
      }
    }
  }

  return { error: null, autoId }
}
