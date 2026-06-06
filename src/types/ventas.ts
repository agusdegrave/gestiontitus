export type EstadoOperacion = "senado" | "en_proceso" | "entregado"

export const ESTADO_OPERACION_LABELS: Record<EstadoOperacion, string> = {
  senado: "Señado",
  en_proceso: "En proceso",
  entregado: "Entregado",
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

// Checklist de hitos de entrega: campo en ventas → etiqueta en UI
export const CHECKLIST_ENTREGA = [
  { field: "entrega_planilla_ok", label: "Planilla de ventas" },
  { field: "entrega_checklist_ok", label: "Check list" },
  { field: "entrega_08_ok", label: "08 firmado" },
  { field: "entrega_veri_ok", label: "Verificación" },
  { field: "entrega_seguro_ok", label: "Seguro" },
  { field: "entrega_control_ok", label: "Control de entrega" },
  { field: "entrega_legajo_ok", label: "Legajo enviado" },
] as const

export type ChecklistField = (typeof CHECKLIST_ENTREGA)[number]["field"]

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
  // Deudas a sumar (todas opcionales; null = sin deuda)
  deuda_muni: number | null
  deuda_rentas: number | null
  deuda_multas: number | null
  gastos_consigna: number | null
  deuda_permuta_muni: number | null
  deuda_permuta_rentas: number | null
  deuda_permuta_multas: number | null
  // Seguimiento / entrega
  fecha_tentativa_entrega: string | null
  fecha_entrega: string | null
  costo_transferencia: number | null
  promesas_alistaje: string | null
  aclaraciones: string | null
  entrega_planilla_ok: boolean
  entrega_checklist_ok: boolean
  entrega_08_ok: boolean
  entrega_veri_ok: boolean
  entrega_seguro_ok: boolean
  entrega_control_ok: boolean
  entrega_legajo_ok: boolean
  creado_en: string | null
  autos?: {
    dominio: string
    marca: string
    modelo: string
    anio: number | null
    estado?: import("./stock").EstadoAuto
    tipo?: import("./stock").TipoAuto
  } | null
  vendedor?: {
    nombre: string
    apellido: string
  } | null
  auto_entrega?: {
    dominio: string
    marca: string
    modelo: string
  } | null
}

export function checklistProgress(v: Venta): { done: number; total: number } {
  const done = CHECKLIST_ENTREGA.filter((c) => v[c.field]).length
  return { done, total: CHECKLIST_ENTREGA.length }
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
