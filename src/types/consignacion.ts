import type { Auto } from "./stock"

export type TipoConsigna = "fisica" | "virtual"
export type EstadoVerif = "pendiente" | "turno_sacado" | "hecha" | "observada"
export type TipoInforme = "dominio" | "multas"
export type EstadoInforme = "pendiente" | "solicitado" | "recibido" | "ok" | "error"

export const TIPO_CONSIGNA_LABELS: Record<TipoConsigna, string> = {
  fisica: "Física",
  virtual: "Virtual",
}

export const ESTADO_VERIF_LABELS: Record<EstadoVerif, string> = {
  pendiente: "Pendiente",
  turno_sacado: "Turno sacado",
  hecha: "Hecha",
  observada: "Observada",
}

export const ESTADO_INFORME_LABELS: Record<EstadoInforme, string> = {
  pendiente: "Pendiente",
  solicitado: "Solicitado",
  recibido: "Recibido",
  ok: "OK",
  error: "Error",
}

export interface Consignacion {
  id: string
  auto_id: string
  tipo: TipoConsigna
  duenio_nombre: string | null
  duenio_apellido: string | null
  duenio_dni: string | null
  duenio_telefono: string | null
  duenio_domicilio: string | null
  exclusividad: boolean
  fecha_carga: string
  responsable_id: string | null
  observaciones: string | null
}

export interface Verificacion {
  id: string
  auto_id: string
  estado: EstadoVerif
  fecha: string | null
  turno: string | null
  responsable_id: string | null
  observaciones: string | null
}

export interface Informe {
  id: string
  auto_id: string
  tipo: TipoInforme
  estado: EstadoInforme
  aprobado: boolean | null
  pdf_url: string | null
  costo: number | null
  pagado: boolean | null
  fecha_solicitud: string | null
  fecha_recibido: string | null
  observaciones: string | null
}

export interface ConsignacionRow extends Auto {
  consignacion: Consignacion | null
  verificacion: Verificacion | null
  informes: Informe[]
}

export interface ConsignacionFilters {
  search: string
  tipoConsigna: string
  estadoVerif: string
}
