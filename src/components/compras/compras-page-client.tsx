"use client"

import { useState } from "react"
import { Loader2, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { ComprasTab } from "./compras-tab"
import { SociosTab } from "./socios-tab"

export const ROLES_COMPRAS = ["administracion", "direccion"]

type Tab = "compras" | "socios"

const TABS: { id: Tab; label: string }[] = [
  { id: "compras", label: "Compras" },
  { id: "socios", label: "Socios" },
]

export function ComprasPageClient() {
  const { usuario, loading } = useAuth()
  const [tab, setTab] = useState<Tab>("compras")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!usuario || !ROLES_COMPRAS.includes(usuario.rol)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <ShieldAlert className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No tenés permisos para ver este módulo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Compras</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Entrada de autos propios y participación de socios
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-[10px] border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-stone-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "compras" ? <ComprasTab /> : <SociosTab />}
    </div>
  )
}
