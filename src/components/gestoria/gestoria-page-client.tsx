"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { CalculadoraTab } from "./calculadora-tab"
import { GestoresTab } from "./gestores-tab"
import { TramitesTab } from "./tramites-tab"
import { MiCajaTab } from "./mi-caja-tab"

// Más adelante se suman las "Cajas"
const TABS = [
  { id: "tramites", label: "Trámites" },
  { id: "calculadora", label: "Calculadora" },
  { id: "gestores", label: "Gestores" },
] as const

// Vista restringida del rol gestor: solo sus trámites y su caja
const TABS_GESTOR = [
  { id: "tramites", label: "Mis trámites" },
  { id: "micaja", label: "Mi caja" },
] as const

type TabId = (typeof TABS)[number]["id"] | (typeof TABS_GESTOR)[number]["id"]

export function GestoriaPageClient() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState<TabId>("tramites")

  if (!usuario) return null

  const esGestor = usuario.rol === "gestor"
  const tabs = esGestor ? TABS_GESTOR : TABS

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Gestoría</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {esGestor
            ? "Tus trámites y tu caja"
            : "Trámites, calculadora de transferencias y gestores"}
        </p>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
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

      {tab === "tramites" && <TramitesTab modoGestor={esGestor} />}
      {esGestor && tab === "micaja" && <MiCajaTab />}
      {!esGestor && tab === "calculadora" && <CalculadoraTab />}
      {!esGestor && tab === "gestores" && <GestoresTab />}
    </div>
  )
}
