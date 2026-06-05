// Valores exactos del enum rol_usuario en la base
export type Rol =
  | "vendedor"
  | "consignatario"
  | "administracion"
  | "alistaje"
  | "direccion"

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
