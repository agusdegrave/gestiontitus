import { LoginForm } from "@/components/auth/login-form"
import { Car } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-[#1c1917] p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Titus Cars
          </span>
        </div>

        <div>
          <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Sistema de gestión
          </p>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Todo tu negocio,<br />en un solo lugar.
          </h1>
          <p className="text-stone-400 text-base leading-relaxed">
            Stock, operaciones, gestoría, caja y más — organizado para que puedas enfocarte en vender.
          </p>
        </div>

        <p className="text-stone-600 text-sm">
          © {new Date().getFullYear()} Titus Cars
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-[10px] bg-brand-500 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">
            Titus Cars
          </span>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Bienvenido
            </h2>
            <p className="text-muted-foreground text-sm">
              Ingresá con tu cuenta para continuar
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
