import { ConsignacionDetailClient } from "@/components/consignacion/consignacion-detail-client"

export const metadata = { title: "Detalle consigna — Titus Cars" }

export default async function ConsignacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ConsignacionDetailClient autoId={id} />
}
