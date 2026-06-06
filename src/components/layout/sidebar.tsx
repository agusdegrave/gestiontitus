"use client"

import { useState } from "react"
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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string | null
  icon: React.ElementType
  active: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Stock", href: "/stock", icon: Car, active: true },
  { label: "Consignación", href: "/consignacion", icon: ArrowLeftRight, active: true },
  { label: "Operaciones", href: "/operaciones", icon: FileText, active: true },
  { label: "Gestoría", href: "/gestoria", icon: ClipboardList, active: true },
  { label: "Caja", href: "/caja", icon: Wallet, active: true },
  { label: "Gestores", href: null, icon: Users, active: false },
  { label: "Dirección", href: null, icon: BarChart3, active: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usuario } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // El rol gestor solo ve Gestoría (su vista restringida)
  const navItems =
    usuario?.rol === "gestor"
      ? NAV_ITEMS.filter((item) => item.label === "Gestoría")
      : NAV_ITEMS

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col h-full bg-[#1c1917] border-r border-[#292524]",
        "overflow-hidden transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-[#292524]">
        <div className="w-8 h-8 rounded-[8px] bg-brand-500 flex items-center justify-center shrink-0">
          <Car className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-[15px] tracking-tight whitespace-nowrap">
            Titus Cars
          </span>
        )}
      </div>

      {/* Toggle */}
      <div
        className={cn(
          "flex px-2 pt-2",
          collapsed ? "justify-center" : "justify-end"
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Desplegar menú" : "Plegar menú"}
          className="p-1.5 rounded-[8px] text-stone-400 hover:bg-[#292524] hover:text-stone-200 transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isCurrentPage = item.href ? pathname.startsWith(item.href) : false

          if (!item.active) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger
                  render={
                    <div
                      className={cn(
                        "flex items-center gap-3 py-2 rounded-[10px] cursor-not-allowed",
                        "text-stone-600 select-none",
                        collapsed ? "justify-center px-0" : "px-3"
                      )}
                    />
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 whitespace-nowrap">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-700 bg-stone-800 px-1.5 py-0.5 rounded-[6px]">
                        Pronto
                      </span>
                    </>
                  )}
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {collapsed ? `${item.label} · Próximamente` : "Próximamente"}
                </TooltipContent>
              </Tooltip>
            )
          }

          const linkClassName = cn(
            "flex items-center gap-3 py-2 rounded-[10px] transition-colors",
            collapsed ? "justify-center px-0" : "px-3",
            isCurrentPage
              ? "bg-brand-500 text-white"
              : "text-stone-400 hover:bg-[#292524] hover:text-stone-200"
          )

          if (collapsed) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger
                  render={<Link href={item.href!} className={linkClassName} />}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link key={item.label} href={item.href!} className={linkClassName}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom spacer */}
      <div className="h-4" />
    </aside>
  )
}
