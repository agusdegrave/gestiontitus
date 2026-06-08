import type { Metadata } from "next"
import { DireccionPageClient } from "@/components/direccion/direccion-page-client"

export const metadata: Metadata = {
  title: "Dirección — Titus Cars",
}

export default function DireccionPage() {
  return <DireccionPageClient />
}
