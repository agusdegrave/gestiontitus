"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { CalculadoraTab } from "./calculadora-tab"
import { GestoresTab } from "./gestores-tab"

// Más adelante se suman "Trámites" y "Cajas"
const TABS = [
  { id: "calculadora", label: "Calculadora" },
  { id: "gestores", label: "Gestores" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function GestoriaPageClient() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState<TabId>("calculadora")

  if (!usuario) return null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Gestoría</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Calculadora de transferencias y gestores
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

      {tab === "calculadora" ? <CalculadoraTab /> : <GestoresTab />}
    </div>
  )
}
