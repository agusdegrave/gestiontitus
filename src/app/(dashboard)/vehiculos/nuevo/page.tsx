import { NuevoVehiculoClient } from "@/components/vehiculos/nuevo-vehiculo-client"

export const metadata = { title: "Cargar vehículo — Titus Cars" }

export default async function NuevoVehiculoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams
  return <NuevoVehiculoClient tipoInicial={tipo} />
}
