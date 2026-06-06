export interface Gestor {
  id: string
  nombre: string
  alias: string | null
  honorario: number | null
  valor_firma: number | null
  activo: boolean
  notas: string | null
}

// Parámetros globales de la calculadora (fila única por agencia)
export interface GestoriaParametros {
  id: string
  pct_arancel: number
  pct_sellado: number
  pct_base_sellado: number
  pct_prenda: number
  costo_alta_baja: number
  costo_formulario: number
}

// Valores exactos del enum en la base
export type EstadoTramite = "pendiente" | "en_proceso" | "papeles_fisicos" | "finalizado"

export const ESTADO_TRAMITE_LABELS: Record<EstadoTramite, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  papeles_fisicos: "Papeles físicos",
  finalizado: "Finalizado",
}

// El costo real recién se carga cuando llegan los papeles físicos
export const ESTADOS_CON_COSTO_REAL: EstadoTramite[] = ["papeles_fisicos", "finalizado"]

export interface Tramite {
  id: string
  venta_id: string | null
  dominio: string
  vehiculo: string | null
  gestor_id: string | null
  estado: EstadoTramite
  fecha_inicio: string | null
  observaciones: string | null
  cobrado_cliente: number | null
  costo_estimado: number | null
  costo_real: number | null
  fecha_papeles: string | null
  deuda_descontada_cliente: number | null
  deuda_pagada_real: number | null
  // Calculadas por la base: NUNCA se mandan en INSERT/UPDATE
  ganancia_transferencia: number | null
  ganancia_deudas: number | null
  creado_en: string | null
  gestores?: {
    nombre: string
    alias: string | null
  } | null
}

export interface TramiteFilters {
  search: string
  gestor_id: string // "" = todos
  estado: string // "" = todos
}

// Valores por defecto si la agencia todavía no tiene su fila de parámetros
export const PARAMETROS_DEFAULT: Omit<GestoriaParametros, "id"> = {
  pct_arancel: 1.0,
  pct_sellado: 1.5,
  pct_base_sellado: 70,
  pct_prenda: 1.2,
  costo_alta_baja: 16500,
  costo_formulario: 18000,
}
