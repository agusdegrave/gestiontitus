import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  icon: LucideIcon
  title: string
  subtitle?: string
  badge?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Shell común de todas las cards del alta de vehículo */
export function FormCard({ icon: Icon, title, subtitle, badge, className, children }: Props) {
  return (
    <section
      className={cn(
        "rounded-[16px] border border-border bg-white p-6 sm:p-7 space-y-5",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-brand-50 flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  )
}
