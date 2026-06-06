"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Usuario } from "@/types"

interface AuthContextValue {
  usuario: Usuario | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  usuario: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUsuario() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setUsuario(null)
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("usuarios")
        .select("id, nombre, apellido, rol, agencia_id, gestor_id")
        .eq("id", user.id)
        .single()

      if (data) {
        setUsuario({
          id: user.id,
          email: user.email!,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: data.rol,
          agencia_id: data.agencia_id,
          gestor_id: data.gestor_id ?? null,
        })
      }

      setLoading(false)
    }

    loadUsuario()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUsuario()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
