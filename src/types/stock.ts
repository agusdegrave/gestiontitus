export type TipoAuto = "propio" | "consigna"
export type EstadoAuto =
  | "por_ingresar"
  | "en_alistaje"
  | "activo"
  | "senado"
  | "vendido"
export type CalificacionPrecio = "barato" | "bien" | "caro"

export const ESTADO_LABELS: Record<EstadoAuto, string> = {
  por_ingresar: "Por ingresar",
  en_alistaje: "En alistaje",
  activo: "Activo",
  senado: "Señado",
  vendido: "Vendido",
}

export const CALIFICACION_LABELS: Record<CalificacionPrecio, string> = {
  barato: "Barato",
  bien: "Bien",
  caro: "Caro",
}

export interface Auto {
  id: string
  tipo: TipoAuto
  estado: EstadoAuto
  eliminado: boolean
  dominio: string
  marca: string
  modelo: string
  version: string | null
  anio: number | null
  km: number | null
  color: string | null
  combustible: string | null
  caja: string | null
  traccion: string | null
  nro_chasis: string | null
  nro_motor: string | null
  precio_compra_ars: number | null
  precio_compra_usd: number | null
  cotizacion_usd: number | null
  precio_pretendido: number | null
  precio_publicado: number | null
  precio_info: number | null
  margen: number | null
  calificacion_precio: CalificacionPrecio | null
  ultima_modif_precio: string | null
  ubicacion: string | null
  responsable_id: string | null
  estado_general: number | null
  itv_vence: string | null
  tiene_gnc: boolean | null
  agencia_id: string
  creado_por: string | null
  creado_en: string | null
  actualizado_por: string | null
  actualizado_en: string | null
  responsable?: { nombre: string; apellido: string } | null
}

export interface AutoFilters {
  search: string
  tipo: string
  estado: string
  responsable_id: string
}

export interface UsuarioSimple {
  id: string
  nombre: string
  apellido: string
}
