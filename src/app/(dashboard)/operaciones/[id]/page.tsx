import { OperacionDetailClient } from "@/components/operaciones/operacion-detail-client"

export const metadata = { title: "Detalle de operación — Titus Cars" }

export default async function OperacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OperacionDetailClient ventaId={id} />
}
