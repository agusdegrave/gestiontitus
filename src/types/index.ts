// Valores exactos del enum rol_usuario en la base
export type Rol =
  | "vendedor"
  | "consignatario"
  | "administracion"
  | "alistaje"
  | "direccion"
  | "gestor"

export interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: Rol
  agencia_id: string
  // Solo para rol 'gestor': lo ata a su fila en gestores
  gestor_id: string | null
}

export interface Agencia {
  id: string
  nombre: string
  slug: string
}
