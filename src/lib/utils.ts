import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPriceARS(value: number | null | undefined): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPriceUSD(value: number | null | undefined): string {
  if (value == null) return "—"
  return `USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(value)}`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—"
  return new Intl.NumberFormat("es-AR").format(value)
}

// Mayúscula inicial (solo la primera letra; no fuerza el resto).
// NO usar en emails, dominios/patentes ni contraseñas.
export function capFirst(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export function formatDateAR(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value + "T00:00:00").toLocaleDateString("es-AR")
}

export function parsePrice(raw: string): number | null {
  const cleaned = raw.trim().replace(/\./g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}
