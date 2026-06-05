"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { softDeleteAuto } from "@/lib/stock"
import type { Auto } from "@/types/stock"

interface Props {
  auto: Auto | null
  open: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeleteDialog({ auto, open, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!auto) return
    setLoading(true)
    setError(null)
    const { error: err } = await softDeleteAuto(auto.id)
    setLoading(false)
    if (err) {
      setError("No se pudo eliminar el auto. Intentá de nuevo.")
      return
    }
    onDeleted()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar auto</DialogTitle>
          <DialogDescription>
            ¿Confirmás que querés eliminar{" "}
            <span className="font-semibold text-foreground">
              {auto?.dominio} — {auto?.marca} {auto?.modelo}
            </span>
            ? Esta acción no se puede deshacer fácilmente.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive rounded-[10px] bg-red-50 px-3 py-2 border border-red-200">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive/90 hover:bg-destructive text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
