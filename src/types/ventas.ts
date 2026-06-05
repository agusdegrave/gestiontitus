export type EstadoOperacion = "senado" | "entregado" | "cancelado"

export const ESTADO_OPERACION_LABELS: Record<EstadoOperacion, string> = {
  senado: "Señado",
  entregado: "Entregado",
  cancelado: "Cancelado",
}

export const FINANCIERAS = [
  "Bancor",
  "Nación",
  "Santander",
  "Galicia",
  "MG",
  "Carfácil",
  "Otra",
] as const

export interface Venta {
  id: string
  auto_id: string
  auto_entrega_id: string | null
  estado_operacion: EstadoOperacion
  fecha_senia: string
  senia: number | null
  lugar_senia: string | null
  vendedor_id: string
  procedencia: string | null
  precio_venta: number | null
  paga_contado: number | null
  paga_permuta: number | null
  paga_financiado: number | null
  financiera: string | null
  cantidad_cuotas: number | null
  costo_prenda: number | null
  comprador_nombre: string
  comprador_apellido: string
  comprador_dni: string | null
  comprador_domicilio: string | null
  comprador_telefono: string | null
  creado_en: string | null
  autos?: {
    dominio: string
    marca: string
    modelo: string
    anio: number | null
  } | null
  vendedor?: {
    nombre: string
    apellido: string
  } | null
}

export interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  estado: "pendiente" | "hecha"
  auto_id: string | null
  creado_en: string | null
  autos?: {
    dominio: string
    marca: string
    modelo: string
  } | null
}

export interface VentaFilters {
  search: string
  estado_operacion: string
}
