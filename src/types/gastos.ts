import type { Moneda } from "./vehiculos"

// Tabla gastos_auto: gastos del vehículo (mecánica, chapería, etc.)
export interface GastoAuto {
  id: string
  auto_id: string
  fecha: string
  concepto: string
  categoria: string | null
  monto: number
  moneda: Moneda
  // Caja de donde sale la plata; el trigger genera el egreso de caja.
  // null solo en gastos viejos (al editar se vuelve obligatorio).
  caja_id: string | null
  creado_en: string | null
}

// categoria es texto libre en la base; estas son las sugeridas del selector
export const CATEGORIAS_GASTO = [
  "Mecánica",
  "Chapería",
  "Limpieza",
  "Repuestos",
  "Gestoría",
  "Otro",
] as const

export function totalesGastos(gastos: GastoAuto[]): { ars: number; usd: number } {
  return gastos.reduce(
    (acc, g) => {
      if (g.moneda === "USD") acc.usd += g.monto
      else acc.ars += g.monto
      return acc
    },
    { ars: 0, usd: 0 }
  )
}
