import type { Metadata } from "next"
import { OperacionesPageClient } from "@/components/operaciones/operaciones-page-client"

export const metadata: Metadata = {
  title: "Operaciones — Titus Cars",
}

export default function OperacionesPage() {
  return <OperacionesPageClient />
}
