import type { TipoAuto } from "./stock"

export type Moneda = "ARS" | "USD"

export interface Socio {
  id: string
  nombre: string
  apellido: string | null
  activo: boolean
}

/* ── Estado de cada card (todo string para inputs controlados) ── */

export interface ConsignaCardState {
  responsable_id: string
  tipo_consigna: string // fisica | virtual
  duenio_nombre: string
  duenio_apellido: string
  duenio_telefono: string
  duenio_domicilio: string
  duenio_dni: string
}

export interface VehiculoCardState {
  dominio: string
  marca: string
  modelo: string
  version: string
  anio: string
  color: string
  km: string
  combustible: string
  fecha_ingreso: string
}

export interface MantenimientoCardState {
  tipo_distribucion: string
  km_cambio_distribucion: string
  km_service: string
  otros_mantenimientos: string
}

export interface PrecioCardState {
  precio_info: string
  moneda_publicacion: Moneda
  precio_pretendido: string
  precio_publicado: string
  calificacion_precio: string
}

export interface VerificacionCardState {
  estado: string // pendiente | turno_sacado | hecha | observada
  turno: string // datetime-local
}

export interface InformesCardState {
  dominio: string // pendiente | solicitado | recibido | ok | error
  multas: string
}

/** Valor especial del select de inversor para "escribir un nombre nuevo" */
export const NUEVO_SOCIO = "__nuevo__"

export interface InversorRow {
  key: number
  socio_id: string // id de socio o NUEVO_SOCIO
  nombre_nuevo: string
  porcentaje: string
  capital: string
  moneda: Moneda
}

export interface CapitalCardState {
  moneda_compra: Moneda
  precio_compra: string
  cotizacion_usd: string
  inversores: InversorRow[]
}

/* ── Payloads para el guardado ── */

export interface InversorInput {
  socio_id: string | null
  nombre_nuevo: string | null
  porcentaje: number | null
  capital_aportado: number | null
  moneda: Moneda
}

export interface CreateVehiculoParams {
  autoPayload: Record<string, unknown> & { tipo: TipoAuto }
  consignacionPayload: Record<string, unknown> | null
  verificacionUpdate: { estado: string; turno: string | null } | null
  informesUpdate: { dominio: string; multas: string } | null
  inversores: InversorInput[]
}
