import type { Moneda } from "./vehiculos"
import type { TipoAuto } from "./stock"

// Vista rentabilidad_auto (solo lectura, RLS solo direccion)
export interface RentabilidadAuto {
  auto_id: string
  dominio: string
  marca: string | null
  modelo: string | null
  anio: number | null
  tipo: TipoAuto
  precio_venta: number | null
  precio_compra: number | null
  gastos_ars: number | null
  comision: number | null
  ganancia: number | null
}

export interface ParticipacionSocio {
  id: string
  auto_id: string
  socio_id: string
  porcentaje: number | null
  capital_aportado: number | null
  moneda: Moneda
  socios?: { nombre: string; apellido: string | null } | null
}

export interface AutoConParticipacion {
  auto_id: string
  dominio: string
  marca: string | null
  modelo: string | null
  anio: number | null
}

// ── Sueldos ───────────────────────────────────────────

// Valores exactos del enum tipo de sueldos en la base
export type TipoSueldo = "sueldo" | "adelanto" | "comision" | "otro"

export const TIPO_SUELDO_LABELS: Record<TipoSueldo, string> = {
  sueldo: "Sueldo",
  adelanto: "Adelanto",
  comision: "Comisión",
  otro: "Otro",
}

export interface Sueldo {
  id: string
  usuario_id: string | null
  nombre_libre: string | null
  tipo: TipoSueldo
  monto: number
  moneda: Moneda
  fecha: string
  concepto: string | null
  creado_en: string | null
  usuario?: { nombre: string; apellido: string } | null
}

export function nombreEmpleado(s: Sueldo): string {
  if (s.usuario) return `${s.usuario.nombre} ${s.usuario.apellido}`
  return s.nombre_libre ?? "—"
}

// ── Comisiones de vendedores ──────────────────────────

export interface VentaComision {
  id: string
  vendedor_id: string
  fecha_senia: string
  comision_base: number | null
  margen_disponible: number | null
  margen_usado: number | null
  autos?: { dominio: string; marca: string; modelo: string } | null
  vendedor?: { nombre: string; apellido: string } | null
}

// Extra por objetivo POR AUTO según autos vendidos en el mes
export function extraPorAuto(autosVendidos: number): number {
  if (autosVendidos >= 10) return 150000
  if (autosVendidos >= 7) return 100000
  return 0
}

// Penalización del margen: factor 0..1 sobre el extra de ese auto.
// Sin margen usado cobra el extra completo; usó todo el margen → 0.
export function factorMargen(v: VentaComision): number {
  const disponible = v.margen_disponible ?? 0
  const usado = v.margen_usado ?? 0
  if (disponible <= 0) return usado > 0 ? 0 : 1
  return Math.max(0, Math.min(1, 1 - usado / disponible))
}

export interface LiquidacionVendedor {
  vendedor_id: string
  nombre: string
  autosVendidos: number
  comisionBase: number
  extraTotal: number
  total: number
  // Detalle por auto: extra ya ajustado por margen
  detalle: { venta: VentaComision; extra: number }[]
}

// Agrupa las ventas del mes por vendedor y calcula base + extra por objetivo
export function liquidarComisiones(ventas: VentaComision[]): LiquidacionVendedor[] {
  const porVendedor = new Map<string, VentaComision[]>()
  for (const v of ventas) {
    const list = porVendedor.get(v.vendedor_id) ?? []
    list.push(v)
    porVendedor.set(v.vendedor_id, list)
  }

  const liquidaciones: LiquidacionVendedor[] = []
  for (const [vendedorId, ventasVendedor] of porVendedor) {
    const extraBase = extraPorAuto(ventasVendedor.length)
    const detalle = ventasVendedor.map((venta) => ({
      venta,
      extra: extraBase * factorMargen(venta),
    }))
    const comisionBase = ventasVendedor.reduce((acc, v) => acc + (v.comision_base ?? 0), 0)
    const extraTotal = detalle.reduce((acc, d) => acc + d.extra, 0)
    liquidaciones.push({
      vendedor_id: vendedorId,
      nombre: ventasVendedor[0].vendedor
        ? `${ventasVendedor[0].vendedor.nombre} ${ventasVendedor[0].vendedor.apellido}`
        : "—",
      autosVendidos: ventasVendedor.length,
      comisionBase,
      extraTotal,
      total: comisionBase + extraTotal,
      detalle,
    })
  }

  return liquidaciones.sort((a, b) => b.total - a.total)
}
