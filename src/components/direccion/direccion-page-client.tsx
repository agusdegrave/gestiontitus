"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { RentabilidadTab } from "./rentabilidad-tab"
import { SociosTab } from "./socios-tab"
import { ComisionesTab } from "./comisiones-tab"
import { SueldosTab } from "./sueldos-tab"

const TABS = [
  { id: "rentabilidad", label: "Rentabilidad" },
  { id: "socios", label: "Socios" },
  { id: "comisiones", label: "Comisiones" },
  { id: "sueldos", label: "Sueldos" },
] as const

type TabId = (typeof TABS)[number]["id"]

// Módulo privado: SOLO rol direccion. Cualquier otro rol se redirige.
// La RLS ya protege los datos; esto es solo navegación.
export function DireccionPageClient() {
  const { usuario, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<TabId>("rentabilidad")

  const sinPermiso = !loading && usuario?.rol !== "direccion"

  useEffect(() => {
    if (sinPermiso) router.replace("/stock")
  }, [sinPermiso, router])

  if (loading || !usuario || sinPermiso) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dirección</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Rentabilidad, liquidación de socios, comisiones de vendedores y sueldos
        </p>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-[10px] border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-brand-500 text-brand-600 bg-brand-50/50"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rentabilidad" && <RentabilidadTab />}
      {tab === "socios" && <SociosTab />}
      {tab === "comisiones" && <ComisionesTab />}
      {tab === "sueldos" && <SueldosTab />}
    </div>
  )
}
