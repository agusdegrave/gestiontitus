"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// El rol gestor solo puede estar en /gestoria: cualquier otra ruta lo redirige.
// La RLS ya protege los datos; esto es solo navegación.
export function GestorGuard({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const esGestorFueraDeLugar =
    usuario?.rol === "gestor" && !pathname.startsWith("/gestoria")

  useEffect(() => {
    if (esGestorFueraDeLugar) router.replace("/gestoria")
  }, [esGestorFueraDeLugar, router])

  if (loading || esGestorFueraDeLugar) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
