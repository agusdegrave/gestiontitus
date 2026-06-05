export type Rol = "admin" | "vendedor" | "gestor" | "director"

export interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: Rol
  agencia_id: string
}

export interface Agencia {
  id: string
  nombre: string
  slug: string
}
