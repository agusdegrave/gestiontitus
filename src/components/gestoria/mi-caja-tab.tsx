"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchCajasSaldos } from "@/lib/caja"
import { formatPriceARS, formatPriceUSD, cn } from "@/lib/utils"
import { MovimientoForm } from "@/components/caja/movimiento-form"
import { MovimientosSection } from "@/components/caja/movimientos-section"
import type { CajaSaldo } from "@/types/caja"

// Vista del rol gestor: SOLO sus cajas (Habitualista y Efectivo; la RLS las
// filtra sola) y los movimientos de esas cajas. Puede cargar movimientos;
// no puede crear cajas, transferir ni ver otras.
export function MiCajaTab() {
  const [cajas, setCajas] = useState<CajaSaldo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [movFormOpen, setMovFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setLoadError(null)
    const { data, error } = await fetchCajasSaldos()
    setLoading(false)
    if (error) {
      setLoadError(`No se pudieron cargar tus cajas: ${error.message}`)
      return
    }
    setCajas(data)
  }, [])

  useEffect(() => { load() }, [load])

  function refreshAll() {
    load({ silent: true })
    setRefreshKey((k) => k + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Mis cajas */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-foreground flex-1">Mis cajas</h2>
        {cajas.length > 0 && (
          <Button
            onClick={() => setMovFormOpen(true)}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo movimiento
          </Button>
        )}
      </div>

      {cajas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tenés cajas asignadas. Pedile al administrador que las cree.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cajas.map((c) => (
            <div
              key={c.id}
              className="rounded-[14px] border border-border bg-card px-4 py-3.5"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-medium text-foreground truncate">{c.nombre}</p>
              </div>
              <p
                className={cn(
                  "text-lg font-bold tabular-nums mt-1",
                  c.saldo < 0 ? "text-red-600" : c.saldo > 0 ? "text-green-600" : "text-foreground"
                )}
              >
                {c.moneda === "USD" ? formatPriceUSD(c.saldo) : formatPriceARS(c.saldo)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Movimientos de mis cajas */}
      <MovimientosSection cajas={cajas} refreshKey={refreshKey} cajaPreseleccionada={null} />

      <MovimientoForm
        open={movFormOpen}
        onClose={() => setMovFormOpen(false)}
        onSaved={refreshAll}
        cajas={cajas}
      />
    </div>
  )
}
