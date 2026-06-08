"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  fetchUsuariosActivos,
  fetchAutorizaciones,
  insertAutorizacion,
  deleteAutorizacion,
} from "@/lib/caja"
import { cn } from "@/lib/utils"
import type { CajaSaldo, UsuarioAutorizable } from "@/types/caja"
import type { Rol } from "@/types"

const ROL_LABELS: Record<Rol, string> = {
  vendedor: "Vendedor",
  consignatario: "Consignatario",
  administracion: "Administración",
  alistaje: "Alistaje",
  direccion: "Dirección",
  gestor: "Gestor",
}

function formatSupabaseError(e: {
  code?: string
  message?: string
  details?: unknown
  hint?: string
}): string {
  return [
    e.code ? `[${e.code}]` : null,
    e.message ?? "error desconocido",
    e.details ? `— ${typeof e.details === "string" ? e.details : JSON.stringify(e.details)}` : null,
    e.hint ? `(hint: ${e.hint})` : null,
  ]
    .filter(Boolean)
    .join(" ")
}

function Toggle({
  checked,
  disabled,
  busy,
  onToggle,
}: {
  checked: boolean
  disabled: boolean
  busy: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || busy}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-brand-500" : "bg-stone-200",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {busy ? (
        <Loader2 className="w-3 h-3 animate-spin text-white mx-auto" />
      ) : (
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      )}
    </button>
  )
}

interface Props {
  caja: CajaSaldo | null
  onClose: () => void
}

// "Autorizar usuarios — [caja]": administra caja_usuarios (quién puede usar la caja).
// Solo lo abre dirección. La RLS limita todo a la agencia (sin filtros a mano).
export function AutorizarDialog({ caja, onClose }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioAutorizable[]>([])
  const [autorizados, setAutorizados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cajaId = caja?.id ?? null

  const load = useCallback(async () => {
    if (!cajaId) return
    setLoading(true)
    setError(null)
    const [usuariosRes, autorizadosRes] = await Promise.all([
      fetchUsuariosActivos(),
      fetchAutorizaciones(cajaId),
    ])
    setLoading(false)
    if (usuariosRes.error) {
      setError(`Error al cargar usuarios: ${formatSupabaseError(usuariosRes.error)}`)
      return
    }
    if (autorizadosRes.error) {
      setError(`Error al cargar autorizaciones: ${formatSupabaseError(autorizadosRes.error)}`)
      return
    }
    setUsuarios(usuariosRes.data)
    setAutorizados(new Set(autorizadosRes.data.map((a) => a.usuario_id)))
  }, [cajaId])

  useEffect(() => {
    if (cajaId) load()
  }, [cajaId, load])

  async function handleToggle(u: UsuarioAutorizable) {
    if (!caja) return
    setBusyId(u.id)
    setError(null)
    const { error: err } = autorizados.has(u.id)
      ? await deleteAutorizacion(caja.id, u.id)
      : await insertAutorizacion(caja.id, u.id)
    if (err) {
      setBusyId(null)
      setError(`Error al guardar: ${formatSupabaseError(err)}`)
      return
    }
    // Releer desde la base para que los toggles queden consistentes
    const { data, error: refErr } = await fetchAutorizaciones(caja.id)
    setBusyId(null)
    if (refErr) {
      setError(`Error al refrescar autorizaciones: ${formatSupabaseError(refErr)}`)
      return
    }
    setAutorizados(new Set(data.map((a) => a.usuario_id)))
  }

  return (
    <Dialog open={!!caja} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Autorizar usuarios — {caja?.nombre}</DialogTitle>
          <DialogDescription>
            Elegí qué usuarios pueden usar esta caja.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto -mx-1 px-1 divide-y divide-stone-100">
            {usuarios.length === 0 && !error && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay usuarios activos en la agencia.
              </p>
            )}
            {usuarios.map((u) => {
              const esDireccion = u.rol === "direccion"
              // Candado gestor: solo cajas de SU gestoría
              const gestorBloqueado =
                u.rol === "gestor" &&
                (caja?.gestor_id == null || caja.gestor_id !== u.gestor_id)
              const disabled = esDireccion || gestorBloqueado

              const toggle = (
                <Toggle
                  checked={autorizados.has(u.id)}
                  disabled={disabled}
                  busy={busyId === u.id}
                  onToggle={() => handleToggle(u)}
                />
              )

              return (
                <div key={u.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.nombre} {u.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROL_LABELS[u.rol] ?? u.rol}
                      {esDireccion && (
                        <span className="text-stone-400"> · Dirección ve todas las cajas</span>
                      )}
                    </p>
                  </div>
                  {gestorBloqueado ? (
                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex" />}>
                        {toggle}
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        Este gestor solo puede usar las cajas de su gestoría
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    toggle
                  )}
                </div>
              )
            })}
          </div>
        )}

        {error && (
          <p className="flex items-start gap-1.5 text-xs text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-[10px]">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
