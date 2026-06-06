export type TipoCaja = "efectivo" | "financiera" | "gestoria" | "alistaje" | "otras"
export type MonedaCaja = "ARS" | "USD"
export type TipoMovimiento = "ingreso" | "egreso"

// Orden y encabezados de los grupos de "Saldos por Caja"
export const TIPOS_CAJA: { tipo: TipoCaja; label: string }[] = [
  { tipo: "efectivo", label: "Efectivo y billeteras" },
  { tipo: "financiera", label: "Financieras" },
  { tipo: "gestoria", label: "Gestoría" },
  { tipo: "alistaje", label: "Alistaje" },
  { tipo: "otras", label: "Otras áreas" },
]

export interface Caja {
  id: string
  nombre: string
  tipo: TipoCaja
  moneda: MonedaCaja
  gestor_id: string | null
}

// Vista cajas_saldos: la caja + su saldo (ingresos − egresos). NUNCA se edita a mano.
export interface CajaSaldo extends Caja {
  saldo: number
}

export interface CajaMovimiento {
  id: string
  caja_id: string
  tipo: TipoMovimiento
  monto: number
  fecha: string
  concepto: string | null
  categoria: string | null
  auto_id: string | null
  creado_en: string | null
  cajas?: {
    nombre: string
    moneda: MonedaCaja
  } | null
  autos?: {
    dominio: string
  } | null
  usuario?: {
    nombre: string
    apellido: string
  } | null
}

export interface MovimientoFilters {
  categoria: string
  caja_id: string // "" = todas
  tipo: string // "" = todos
  desde: string
  hasta: string
}

export const CATEGORIAS_SUGERIDAS = [
  "Sueldo",
  "Venta auto propio",
  "Venta consigna",
  "Taller",
  "Gestoría",
  "Transferencia",
]
