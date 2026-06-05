"use client"

import { Car, Crown, Handshake } from "lucide-react"
import { cn } from "@/lib/utils"
import { FormCard } from "./form-card"
import type { TipoAuto } from "@/types/stock"

interface Props {
  value: TipoAuto
  onChange: (tipo: TipoAuto) => void
  /** Si es false se oculta la opción "Propio" (solo administracion/direccion) */
  puedePropio: boolean
}

export function CardTipo({ value, onChange, puedePropio }: Props) {
  return (
    <FormCard icon={Car} title="Tipo de vehículo" subtitle="¿Cómo entra el auto a la agencia?">
      <div className={cn("grid gap-3", puedePropio ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        {puedePropio && (
          <button
            type="button"
            onClick={() => onChange("propio")}
            className={cn(
              "flex items-center gap-4 rounded-[14px] border-2 px-5 py-4 text-left transition-colors",
              value === "propio"
                ? "border-blue-500 bg-blue-50"
                : "border-border hover:border-stone-300 hover:bg-stone-50"
            )}
          >
            <div
              className={cn(
                "w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0",
                value === "propio" ? "bg-blue-500 text-white" : "bg-stone-100 text-stone-500"
              )}
            >
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", value === "propio" ? "text-blue-700" : "text-foreground")}>
                Propio
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                La agencia compra el auto
              </p>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => onChange("consigna")}
          className={cn(
            "flex items-center gap-4 rounded-[14px] border-2 px-5 py-4 text-left transition-colors",
            value === "consigna"
              ? "border-green-500 bg-green-50"
              : "border-border hover:border-stone-300 hover:bg-stone-50"
          )}
        >
          <div
            className={cn(
              "w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0",
              value === "consigna" ? "bg-green-500 text-white" : "bg-stone-100 text-stone-500"
            )}
          >
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <p className={cn("text-sm font-semibold", value === "consigna" ? "text-green-700" : "text-foreground")}>
              Consigna
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Un cliente deja el auto para la venta
            </p>
          </div>
        </button>
      </div>
    </FormCard>
  )
}
