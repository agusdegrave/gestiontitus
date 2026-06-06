"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  ArrowLeftRight,
  List,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { fetchCajasSaldos, fetchTotalesHoy, deleteCaja } from "@/lib/caja"
import { fetchGestores } from "@/lib/gestoria"
import { formatPriceARS, formatPriceUSD, cn } from "@/lib/utils"
import { TIPOS_CAJA } from "@/types/caja"
import { CajaForm } from "./caja-form"
import { MovimientoForm } from "./movimiento-form"
import { TransferirDialog } from "./transferir-dialog"
import { MovimientosSection } from "./movimientos-section"
import type { CajaSaldo } from "@/types/caja"
import type { Gestor } from "@/types/gestoria"

const ROLES_GESTIONAN = ["administracion", "direccion"]

interface ParMonedas {
  ARS: number
  USD: number
}

function sumarPorMoneda(cajas: CajaSaldo[]): ParMonedas {
  return cajas.reduce<ParMonedas>(
    (acc, c) => {
      acc[c.moneda] += c.saldo ?? 0
      return acc
    },
    { ARS: 0, USD: 0 }
  )
}

function MontoMoneda({ value, moneda }: { value: number; moneda: "ARS" | "USD" }) {
  return (
    <span className={cn("tabular-nums", value < 0 && "text-red-600")}>
      {moneda === "USD" ? formatPriceUSD(value) : formatPriceARS(value)}
    </span>
  )
}

function ResumenCard({ label, valores, icon: Icon, iconClass }: {
  label: string
  valores: ParMonedas
  icon: React.ElementType
  iconClass: string
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", iconClass)} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-bold mt-1">
        <MontoMoneda value={valores.ARS} moneda="ARS" />
      </p>
      {valores.USD !== 0 && (
        <p className="text-sm font-semibold text-muted-foreground">
          <MontoMoneda value={valores.USD} moneda="USD" />
        </p>
      )}
    </div>
  )
}

export function CajaPageClient() {
  const { usuario } = useAuth()

  const [cajas, setCajas] = useState<CajaSaldo[]>([])
  const [totalesHoy, setTotalesHoy] = useState({
    ingresos: { ARS: 0, USD: 0 },
    egresos: { ARS: 0, USD: 0 },
  })
  const [gestores, setGestores] = useState<Gestor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Incrementa para que la sección de movimientos se refresque
  const [refreshKey, setRefreshKey] = useState(0)
  const [cajaPreseleccionada, setCajaPreseleccionada] = useState<string | null>(null)

  const [cajaFormOpen, setCajaFormOpen] = useState(false)
  const [editingCaja, setEditingCaja] = useState<CajaSaldo | null>(null)
  const [movFormOpen, setMovFormOpen] = useState(false)
  const [transferirDe, setTransferirDe] = useState<CajaSaldo | null>(null)

  const [deleting, setDeleting] = useState<CajaSaldo | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canManage = usuario ? ROLES_GESTIONAN.includes(usuario.rol) : false
  const canMov = canManage || usuario?.rol === "alistaje"
  const canDelete = usuario?.rol === "direccion"

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setLoadError(null)
    const [saldosRes, hoy] = await Promise.all([fetchCajasSaldos(), fetchTotalesHoy()])
    setLoading(false)
    if (saldosRes.error) {
      setLoadError(`No se pudieron cargar las cajas: ${saldosRes.error.message}`)
      return
    }
    setCajas(saldosRes.data)
    setTotalesHoy(hoy)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (canManage) fetchGestores().then(({ data }) => setGestores(data))
  }, [canManage])

  // Tras guardar movimiento/transferencia/caja: refresca saldos + movimientos
  function refreshAll() {
    load({ silent: true })
    setRefreshKey((k) => k + 1)
  }

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError(null)
    const { error } = await deleteCaja(deleting.id)
    setDeleteLoading(false)
    if (error) {
      setDeleteError(error.message)
      return
    }
    setDeleting(null)
    refreshAll()
  }

  if (!usuario) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalGeneral = sumarPorMoneda(cajas)
  const grupos = TIPOS_CAJA
    .map((t) => ({ ...t, cajas: cajas.filter((c) => c.tipo === t.tipo) }))
    .filter((g) => g.cajas.length > 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Caja</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Saldos por caja, movimientos y transferencias
          </p>
        </div>
        {canMov && (
          <Button
            onClick={() => setMovFormOpen(true)}
            variant="outline"
            className="rounded-[10px] gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo movimiento
          </Button>
        )}
        {canManage && (
          <Button
            onClick={() => { setEditingCaja(null); setCajaFormOpen(true) }}
            className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nueva caja
          </Button>
        )}
      </div>

      {loadError && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{loadError}</p>
        </div>
      )}

      {/* Tarjetas-resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ResumenCard
          label="Total General"
          valores={totalGeneral}
          icon={Wallet}
          iconClass="text-brand-500"
        />
        <ResumenCard
          label="Ingresos Hoy"
          valores={totalesHoy.ingresos}
          icon={TrendingUp}
          iconClass="text-green-600"
        />
        <ResumenCard
          label="Egresos Hoy"
          valores={totalesHoy.egresos}
          icon={TrendingDown}
          iconClass="text-red-600"
        />
      </div>

      {/* Saldos por caja, agrupados por tipo */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Saldos por Caja</h2>
        {grupos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay cajas visibles para tu usuario.
          </p>
        )}
        {grupos.map((grupo) => {
          const subtotal = sumarPorMoneda(grupo.cajas)
          return (
            <div key={grupo.tipo} className="space-y-2">
              <div className="flex items-baseline gap-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {grupo.label}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatPriceARS(subtotal.ARS)}
                  {subtotal.USD !== 0 && <> · {formatPriceUSD(subtotal.USD)}</>}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {grupo.cajas.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-[14px] border border-border bg-card px-4 py-3 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.nombre}</p>
                      {/* Efectivo queda neutro; el resto verde/rojo según signo (cero neutro) */}
                      <p className={cn(
                        "text-lg font-bold tabular-nums mt-0.5",
                        c.saldo < 0
                          ? "text-red-600"
                          : c.tipo !== "efectivo" && c.saldo > 0
                            ? "text-green-600"
                            : "text-foreground"
                      )}>
                        {c.moneda === "USD" ? formatPriceUSD(c.saldo) : formatPriceARS(c.saldo)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            title="Opciones"
                          />
                        }
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuItem
                          className="whitespace-nowrap"
                          onClick={() => setCajaPreseleccionada(c.id)}
                        >
                          <List className="w-3.5 h-3.5" />
                          Ver movimientos
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuItem
                              onClick={() => { setEditingCaja(c); setCajaFormOpen(true) }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTransferirDe(c)}>
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              Transferir
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => { setDeleteError(null); setDeleting(c) }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Movimientos recientes */}
      <MovimientosSection
        cajas={cajas}
        refreshKey={refreshKey}
        cajaPreseleccionada={cajaPreseleccionada}
      />

      {/* Dialogs */}
      <CajaForm
        open={cajaFormOpen}
        onClose={() => setCajaFormOpen(false)}
        onSaved={refreshAll}
        caja={editingCaja}
        gestores={gestores}
      />
      <MovimientoForm
        open={movFormOpen}
        onClose={() => setMovFormOpen(false)}
        onSaved={refreshAll}
        cajas={cajas}
      />
      <TransferirDialog
        open={!!transferirDe}
        onClose={() => setTransferirDe(null)}
        onSaved={refreshAll}
        origen={transferirDe}
        cajas={cajas}
      />

      {/* Confirmación de eliminado (solo dirección) */}
      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar caja</DialogTitle>
            <DialogDescription>
              ¿Confirmás que querés eliminar{" "}
              <span className="font-semibold text-foreground">{deleting?.nombre}</span>?
              Se borran también todos sus movimientos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive/90 hover:bg-destructive text-white"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
