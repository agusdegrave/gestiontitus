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

// Valores por defecto si la agencia todavía no tiene su fila de parámetros
export const PARAMETROS_DEFAULT: Omit<GestoriaParametros, "id"> = {
  pct_arancel: 1.0,
  pct_sellado: 1.5,
  pct_base_sellado: 70,
  pct_prenda: 1.2,
  costo_alta_baja: 16500,
  costo_formulario: 18000,
}
