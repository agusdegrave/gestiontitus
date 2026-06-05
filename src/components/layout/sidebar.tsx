"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Car,
  ArrowLeftRight,
  FileText,
  ClipboardList,
  Wallet,
  Users,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string | null
  icon: React.ElementType
  active: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Stock", href: "/stock", icon: Car, active: true },
  { label: "Consignación", href: null, icon: ArrowLeftRight, active: false },
  { label: "Operaciones", href: null, icon: FileText, active: false },
  { label: "Gestoría", href: null, icon: ClipboardList, active: false },
  { label: "Caja", href: null, icon: Wallet, active: false },
  { label: "Gestores", href: null, icon: Users, active: false },
  { label: "Dirección", href: null, icon: BarChart3, active: false },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-full bg-[#1c1917] border-r border-[#292524]">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-[#292524]">
        <div className="w-8 h-8 rounded-[8px] bg-brand-500 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-[15px] tracking-tight">
          Titus Cars
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isCurrentPage = item.href ? pathname.startsWith(item.href) : false

          if (!item.active) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-not-allowed",
                        "text-stone-600 select-none"
                      )}
                    />
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-700 bg-stone-800 px-1.5 py-0.5 rounded-[6px]">
                    Pronto
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  Próximamente
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[10px] transition-colors",
                isCurrentPage
                  ? "bg-brand-500 text-white"
                  : "text-stone-400 hover:bg-[#292524] hover:text-stone-200"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-4" />
    </aside>
  )
}
