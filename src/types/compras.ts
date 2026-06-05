export type OrigenCompra = "calle" | "permuta" | "consigna_comprada"
export type MonedaCapital = "ARS" | "USD"

export const ORIGEN_LABELS: Record<OrigenCompra, string> = {
  calle: "Calle",
  permuta: "Permuta",
  consigna_comprada: "Consigna",
}

export interface Socio {
  id: string
  nombre: string
  apellido: string | null
  dni: string | null
  telefono: string | null
  activo: boolean
  notas: string | null
  creado_en?: string | null
}

export interface Participacion {
  id: string
  auto_id: string
  socio_id: string
  capital_aportado: number | null
  moneda: MonedaCapital
  porcentaje: number | null
  socios?: { nombre: string; apellido: string | null } | null
}

export interface CompraRow {
  id: string
  auto_id: string
  origen: OrigenCompra
  fecha_compra: string
  vendedor_nombre: string | null
  vendedor_dni: string | null
  vendedor_telefono: string | null
  precio_compra_ars: number | null
  precio_compra_usd: number | null
  cotizacion_usd: number | null
  forma_pago: string | null
  observaciones: string | null
  creado_en: string | null
  autos?: {
    dominio: string
    marca: string | null
    modelo: string | null
    anio: number | null
  } | null
  participacion_auto: Participacion[]
}

/** Auto resumido para los selectores del form (pendientes de permuta / consignas) */
export interface AutoCompra {
  id: string
  dominio: string
  marca: string | null
  modelo: string | null
  anio: number | null
  km: number | null
  color: string | null
  precio_compra_ars: number | null
  precio_pretendido: number | null
}

export interface ComprasFilters {
  search: string
  origen: string
}

export interface ParticipacionInput {
  socio_id: string
  capital_aportado: number | null
  moneda: MonedaCapital
  porcentaje: number | null
}
