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

// Opciones del selector Financiera / Banco en la ficha de operación
// (ventas.financiera). Cada una tiene su checklist en la tabla financiacion.
export const BANCOS_FINANCIACION = [
  "Bancor / Nación",
  "Santander / Galicia",
  "MG",
  "Carfácil / Finanzas",
  "Otra",
] as const

export type BancoFinanciacion = (typeof BANCOS_FINANCIACION)[number]

// Tabla financiacion: 1 fila por venta (upsert por venta_id)
export interface Financiacion {
  id: string
  venta_id: string
  // Bancor / Nación
  bn_cargado: boolean
  bn_firmado_tarjeta: boolean
  bn_liquidado: boolean
  // Santander / Galicia
  sg_validacion: boolean
  sg_doc_inf_dom: boolean
  sg_doc_veri: boolean
  sg_doc_titulo: boolean
  sg_doc_08: boolean
  sg_doc_cedula: boolean
  sg_turno: string | null
  // MG
  mg_validacion: boolean
  mg_doc_foto_auto: boolean
  mg_doc_informe: boolean
  mg_doc_dni: boolean
  mg_doc_veri: boolean
  mg_doc_tarj_tit: boolean
  mg_pedir_seguro: boolean
  mg_coord_juanma: boolean
  mg_seguro_vendedor: boolean
  // Carfácil / Finanzas
  cf_cargado: boolean
  cf_prenda_fisica: boolean
  cf_firmado: boolean
  cf_enviar_legajo: boolean
}

export type FinanciacionBoolField = Exclude<keyof Financiacion, "id" | "venta_id" | "sg_turno">

// Checklist por banco: checks simples, sub-lista de documentación o campo de fecha
export type FinanciacionItem =
  | { kind: "check"; field: FinanciacionBoolField; label: string }
  | { kind: "docs"; label: string; items: { field: FinanciacionBoolField; label: string }[] }
  | { kind: "fecha"; field: "sg_turno"; label: string }

export const FINANCIACION_CHECKLIST: Record<BancoFinanciacion, FinanciacionItem[]> = {
  "Bancor / Nación": [
    { kind: "check", field: "bn_cargado", label: "Cargado" },
    { kind: "check", field: "bn_firmado_tarjeta", label: "Firmado / Crear tarjeta" },
    { kind: "check", field: "bn_liquidado", label: "Liquidado" },
  ],
  "Santander / Galicia": [
    { kind: "check", field: "sg_validacion", label: "Validación" },
    {
      kind: "docs",
      label: "Documentación",
      items: [
        { field: "sg_doc_inf_dom", label: "Informe de dominio" },
        { field: "sg_doc_veri", label: "Verificación" },
        { field: "sg_doc_titulo", label: "Título" },
        { field: "sg_doc_08", label: "08" },
        { field: "sg_doc_cedula", label: "Cédula" },
      ],
    },
    { kind: "fecha", field: "sg_turno", label: "Turno" },
  ],
  MG: [
    { kind: "check", field: "mg_validacion", label: "Validación" },
    {
      kind: "docs",
      label: "Documentación",
      items: [
        { field: "mg_doc_foto_auto", label: "Foto del auto" },
        { field: "mg_doc_informe", label: "Informe" },
        { field: "mg_doc_dni", label: "DNI" },
        { field: "mg_doc_veri", label: "Verificación" },
        { field: "mg_doc_tarj_tit", label: "Tarjeta / Título" },
      ],
    },
    { kind: "check", field: "mg_pedir_seguro", label: "Pedir seguro" },
    { kind: "check", field: "mg_coord_juanma", label: "Coordinar con Juanma" },
    { kind: "check", field: "mg_seguro_vendedor", label: "Seguro vendedor" },
  ],
  "Carfácil / Finanzas": [
    { kind: "check", field: "cf_cargado", label: "Cargado" },
    { kind: "check", field: "cf_prenda_fisica", label: "Prenda física en posesión" },
    { kind: "check", field: "cf_firmado", label: "Firmado" },
    { kind: "check", field: "cf_enviar_legajo", label: "Enviar legajo" },
  ],
  Otra: [],
}

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
  // Embed de la tabla financiacion (solo en la lista, para el progreso global)
  financiacion?: Financiacion | null
}

export function checklistProgress(v: Venta): { done: number; total: number } {
  const done = CHECKLIST_ENTREGA.filter((c) => v[c.field]).length
  return { done, total: CHECKLIST_ENTREGA.length }
}

// Valores viejos del selector de alta ("Bancor", "Galicia"...) → opción agrupada actual
export function normalizeBanco(f: string | null | undefined): "" | BancoFinanciacion {
  if (!f) return ""
  if ((BANCOS_FINANCIACION as readonly string[]).includes(f)) return f as BancoFinanciacion
  if (f === "Bancor" || f === "Nación") return "Bancor / Nación"
  if (f === "Santander" || f === "Galicia") return "Santander / Galicia"
  if (f === "Carfácil") return "Carfácil / Finanzas"
  return "Otra"
}

// Pasos del banco que cuentan para el progreso global (la fecha de turno NO cuenta)
export function pasosBanco(banco: BancoFinanciacion): FinanciacionBoolField[] {
  return FINANCIACION_CHECKLIST[banco].flatMap((it) =>
    it.kind === "check" ? [it.field] : it.kind === "docs" ? it.items.map((d) => d.field) : []
  )
}

// Progreso global de la operación: 7 hitos de entrega + pasos del banco si es financiada
export function operacionProgress(v: Venta): { done: number; total: number; pct: number } {
  let { done, total } = checklistProgress(v)
  const banco = normalizeBanco(v.financiera)
  if ((v.paga_financiado ?? 0) > 0 && banco) {
    const pasos = pasosBanco(banco)
    total += pasos.length
    done += pasos.filter((f) => v.financiacion?.[f] === true).length
  }
  return { done, total, pct: Math.round((done / total) * 100) }
}

// Suma de todas las deudas a sumar de la operación (null = 0)
export function totalDeudasVenta(v: Venta): number {
  return [
    v.deuda_muni,
    v.deuda_rentas,
    v.deuda_multas,
    v.gastos_consigna,
    v.deuda_permuta_muni,
    v.deuda_permuta_rentas,
    v.deuda_permuta_multas,
  ].reduce<number>((acc, d) => acc + (d ?? 0), 0)
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
