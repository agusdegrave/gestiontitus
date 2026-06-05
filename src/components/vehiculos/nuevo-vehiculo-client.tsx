"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { parsePrice } from "@/lib/utils"
import { fetchUsuariosAgencia } from "@/lib/stock"
import { fetchSociosActivos, createVehiculo } from "@/lib/vehiculos"
import { CardTipo } from "./cards/card-tipo"
import { CardConsignacion } from "./cards/card-consignacion"
import { CardVehiculo } from "./cards/card-vehiculo"
import { CardMantenimiento } from "./cards/card-mantenimiento"
import { CardPrecio } from "./cards/card-precio"
import { CardVerificacion } from "./cards/card-verificacion"
import { CardInformes } from "./cards/card-informes"
import { CardCapital, nuevaFilaInversor } from "./cards/card-capital"
import { NUEVO_SOCIO } from "@/types/vehiculos"
import type {
  ConsignaCardState,
  VehiculoCardState,
  MantenimientoCardState,
  PrecioCardState,
  VerificacionCardState,
  InformesCardState,
  CapitalCardState,
  Socio,
  InversorInput,
} from "@/types/vehiculos"
import type { TipoAuto, UsuarioSimple } from "@/types/stock"
import type { Usuario } from "@/types"

const ROLES_FULL = ["administracion", "direccion"]

const today = () => new Date().toISOString().split("T")[0]

interface Props {
  tipoInicial?: string
}

export function NuevoVehiculoClient({ tipoInicial }: Props) {
  const { usuario, loading } = useAuth()

  if (loading || !usuario) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <NuevoVehiculoForm usuario={usuario} tipoInicial={tipoInicial} />
}

function NuevoVehiculoForm({ usuario, tipoInicial }: { usuario: Usuario; tipoInicial?: string }) {
  const router = useRouter()
  const canFull = ROLES_FULL.includes(usuario.rol)

  // El ?tipo= de la URL prellena; los roles sin permiso solo cargan consignas
  const [tipo, setTipo] = useState<TipoAuto>(
    canFull && tipoInicial === "propio" ? "propio" : "consigna"
  )

  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([])
  const [socios, setSocios] = useState<Socio[]>([])

  const [consigna, setConsigna] = useState<ConsignaCardState>({
    responsable_id: usuario.id,
    tipo_consigna: "fisica",
    duenio_nombre: "",
    duenio_apellido: "",
    duenio_telefono: "",
    duenio_domicilio: "",
    duenio_dni: "",
  })

  const [vehiculo, setVehiculo] = useState<VehiculoCardState>({
    dominio: "",
    marca: "",
    modelo: "",
    version: "",
    anio: "",
    color: "",
    km: "",
    combustible: "",
    fecha_ingreso: today(),
  })

  const [mantenimiento, setMantenimiento] = useState<MantenimientoCardState>({
    tipo_distribucion: "",
    km_cambio_distribucion: "",
    km_service: "",
    otros_mantenimientos: "",
  })

  const [precio, setPrecio] = useState<PrecioCardState>({
    precio_info: "",
    moneda_publicacion: "ARS",
    precio_pretendido: "",
    precio_publicado: "",
    calificacion_precio: "",
  })

  const [verificacion, setVerificacion] = useState<VerificacionCardState>({
    estado: "pendiente",
    turno: "",
  })

  const [informes, setInformes] = useState<InformesCardState>({
    dominio: "pendiente",
    multas: "pendiente",
  })

  const [capital, setCapital] = useState<CapitalCardState>({
    moneda_compra: "ARS",
    precio_compra: "",
    cotizacion_usd: "",
    inversores: [],
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchUsuariosAgencia(usuario.agencia_id).then(setUsuarios)
  }, [usuario.agencia_id])

  // Socios + fila default "Agencia" al 100%
  useEffect(() => {
    if (!canFull) return
    fetchSociosActivos().then((data) => {
      setSocios(data)
      const agencia = data.find((s) => s.nombre.trim().toLowerCase() === "agencia")
      setCapital((prev) =>
        prev.inversores.length > 0
          ? prev
          : {
              ...prev,
              inversores: [
                nuevaFilaInversor(
                  agencia
                    ? { socio_id: agencia.id, porcentaje: "100" }
                    : { socio_id: NUEVO_SOCIO, nombre_nuevo: "Agencia", porcentaje: "100" }
                ),
              ],
            }
      )
    })
  }, [canFull])

  const patch =
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (p: Partial<T>) =>
      setter((prev) => ({ ...prev, ...p }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vehiculo.dominio.trim()) {
      setError("El dominio es obligatorio.")
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    setSaving(true)
    setError(null)

    const pretendido = parsePrice(precio.precio_pretendido)
    const publicado = parsePrice(precio.precio_publicado)
    const precioCompra = tipo === "propio" ? parsePrice(capital.precio_compra) : null
    const cotizacion = tipo === "propio" ? parsePrice(capital.cotizacion_usd) : null

    // Margen: consigna → publicado − pretendido; propio → publicado − compra
    let margen: number | null = null
    if (tipo === "consigna") {
      if (publicado !== null && pretendido !== null) margen = publicado - pretendido
    } else if (publicado !== null && precioCompra !== null) {
      if (capital.moneda_compra === "ARS") {
        margen = publicado - precioCompra
      } else if (cotizacion !== null) {
        margen = publicado - precioCompra * cotizacion
      }
    }

    const autoPayload = {
      tipo,
      estado: (tipo === "consigna" ? "activo" : "en_alistaje") as "activo" | "en_alistaje",
      eliminado: false,
      dominio: vehiculo.dominio.trim().toUpperCase(),
      marca: vehiculo.marca.trim() || null,
      modelo: vehiculo.modelo.trim() || null,
      version: vehiculo.version.trim() || null,
      anio: vehiculo.anio ? parseInt(vehiculo.anio) : null,
      color: vehiculo.color.trim() || null,
      km: vehiculo.km ? parseInt(vehiculo.km.replace(/\./g, "")) : null,
      combustible: vehiculo.combustible || null,
      fecha_ingreso: vehiculo.fecha_ingreso || today(),
      tipo_distribucion: mantenimiento.tipo_distribucion || null,
      km_cambio_distribucion: mantenimiento.km_cambio_distribucion
        ? parseInt(mantenimiento.km_cambio_distribucion)
        : null,
      km_service: mantenimiento.km_service ? parseInt(mantenimiento.km_service) : null,
      otros_mantenimientos: mantenimiento.otros_mantenimientos.trim() || null,
      precio_info: parsePrice(precio.precio_info),
      moneda_publicacion: precio.moneda_publicacion,
      precio_pretendido: pretendido,
      precio_publicado: publicado,
      calificacion_precio: (precio.calificacion_precio || null) as
        | "barato" | "bien" | "caro" | null,
      margen,
      responsable_id: tipo === "consigna" ? consigna.responsable_id || null : null,
      ...(tipo === "propio"
        ? {
            precio_compra_ars: capital.moneda_compra === "ARS" ? precioCompra : null,
            precio_compra_usd: capital.moneda_compra === "USD" ? precioCompra : null,
            cotizacion_usd: cotizacion,
          }
        : {}),
    }

    const consignacionPayload =
      tipo === "consigna"
        ? {
            tipo: consigna.tipo_consigna,
            fecha_carga: vehiculo.fecha_ingreso || today(),
            duenio_nombre: consigna.duenio_nombre.trim() || null,
            duenio_apellido: consigna.duenio_apellido.trim() || null,
            duenio_telefono: consigna.duenio_telefono.trim() || null,
            duenio_domicilio: consigna.duenio_domicilio.trim() || null,
            duenio_dni: consigna.duenio_dni.trim() || null,
            responsable_id: consigna.responsable_id || null,
          }
        : null

    const verificacionUpdate =
      canFull && (verificacion.estado !== "pendiente" || verificacion.turno)
        ? { estado: verificacion.estado, turno: verificacion.turno || null }
        : null

    const informesUpdate =
      canFull && (informes.dominio !== "pendiente" || informes.multas !== "pendiente")
        ? { dominio: informes.dominio, multas: informes.multas }
        : null

    const inversores: InversorInput[] =
      tipo === "propio" && canFull
        ? capital.inversores
            .filter((r) => (r.socio_id && r.socio_id !== NUEVO_SOCIO) || r.nombre_nuevo.trim())
            .map((r) => {
              const pct = parseFloat(r.porcentaje.replace(",", "."))
              return {
                socio_id: r.socio_id !== NUEVO_SOCIO ? r.socio_id : null,
                nombre_nuevo: r.socio_id === NUEVO_SOCIO ? r.nombre_nuevo.trim() : null,
                porcentaje: isNaN(pct) ? null : pct,
                capital_aportado: parsePrice(r.capital),
                moneda: r.moneda,
              }
            })
        : []

    const { error: err } = await createVehiculo({
      autoPayload,
      consignacionPayload,
      verificacionUpdate,
      informesUpdate,
      inversores,
    })
    setSaving(false)

    if (err) {
      setError(`No se pudo guardar: ${err.message}`)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push(tipo === "consigna" ? "/consignacion" : "/stock")
    }, 1200)
  }

  if (success) {
    return (
      <div className="max-w-[950px] mx-auto flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">¡Vehículo creado!</h2>
        <p className="text-sm text-muted-foreground">
          Te llevamos a {tipo === "consigna" ? "Consignación" : "Stock"}...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-[950px] mx-auto">
      {/* Encabezado */}
      <div className="flex items-start gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-stone-100 transition-colors shrink-0"
          title="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cargar nuevo vehículo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Completá la información del vehículo
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3 mb-5">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <CardTipo value={tipo} onChange={setTipo} puedePropio={canFull} />

        {tipo === "consigna" && (
          <CardConsignacion value={consigna} onChange={patch(setConsigna)} usuarios={usuarios} />
        )}

        <CardVehiculo value={vehiculo} onChange={patch(setVehiculo)} />
        <CardMantenimiento value={mantenimiento} onChange={patch(setMantenimiento)} />
        <CardPrecio value={precio} onChange={patch(setPrecio)} />
        <CardVerificacion value={verificacion} onChange={patch(setVerificacion)} editable={canFull} />
        <CardInformes value={informes} onChange={patch(setInformes)} editable={canFull} />

        {tipo === "propio" && canFull && (
          <CardCapital value={capital} onChange={patch(setCapital)} socios={socios} />
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="rounded-[12px] h-11 px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="rounded-[12px] h-11 px-8 bg-brand-500 hover:bg-brand-600 text-white text-base font-semibold"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Guardando...</>
            ) : (
              "Crear vehículo"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
