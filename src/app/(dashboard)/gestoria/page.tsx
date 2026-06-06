import type { Metadata } from "next"
import { GestoriaPageClient } from "@/components/gestoria/gestoria-page-client"

export const metadata: Metadata = {
  title: "Gestoría — Titus Cars",
}

export default function GestoriaPage() {
  return <GestoriaPageClient />
}
