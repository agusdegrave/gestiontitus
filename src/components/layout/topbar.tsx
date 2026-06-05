"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, ChevronDown } from "lucide-react"

export function Topbar() {
  const router = useRouter()
  const { usuario } = useAuth()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const initials = usuario
    ? `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase()
    : "TC"

  const displayName = usuario
    ? `${usuario.nombre} ${usuario.apellido}`
    : "Cargando..."

  return (
    <header className="h-14 flex items-center justify-end px-6 bg-background border-b border-border shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 hover:bg-muted transition-colors outline-none"
        >
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs font-semibold bg-[#fff7ed] text-[#c2570c]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {displayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {usuario && (
            <>
              <div className="px-2 py-2">
                <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                <p className="text-xs font-medium text-foreground capitalize mt-0.5">
                  {usuario.rol}
                </p>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
