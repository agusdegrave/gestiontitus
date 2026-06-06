import type { Metadata } from "next"
import { CajaPageClient } from "@/components/caja/caja-page-client"

export const metadata: Metadata = {
  title: "Caja — Titus Cars",
}

export default function CajaPage() {
  return <CajaPageClient />
}
