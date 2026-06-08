"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { GastosAutoSection } from "@/components/vehiculos/gastos-auto-section"
import { fetchConsignacionById, updateAuto, updateConsignacionRecord, updateVerificacion, updateInforme } from "@/lib/consignacion"
import { fetchUsuariosAgencia } from "@/lib/stock"
import { formatPriceARS, parsePrice, capFirst } from "@/lib/utils"
import { EstadoChip } from "@/components/stock/chips"
import { TipoConsignaChip, VerifChip, InformeEstadoChip } from "./consignacion-chips"
import type { ConsignacionRow, Consignacion, Verificacion, Informe } from "@/types/consignacion"
import type { UsuarioSimple } from "@/types/stock"

function SaveStatus({ saving, saved, error }: { saving: boolean; saved: boolean; error: string | null }) {
  if (saving) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
  if (error) return <span className="flex items-center gap-1 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5" />{error}</span>
  if (saved) return <span className="flex items-center gap-1 text-xs text-green-600"><Check className="w-3.5 h-3.5" />Guardado</span>
  return null
}

function SectionCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-border bg-white overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border bg-stone-50">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-3 bg-stone-50">{footer}</div>}
    </div>
  )
}

export function ConsignacionDetailClient({ autoId }: { autoId: string }) {
  const { usuario } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<ConsignacionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([])

  // â”€â”€ Auto section state â”€â”€
  const [autoForm, setAutoForm] = useState({
    dominio: "", marca: "", modelo: "", version: "", anio: "", km: "",
    color: "", combustible: "", precio_pretendido: "", precio_publicado: "",
    calificacion_precio: "", responsable_id: "", estado: "", ubicacion: "",
    estado_general: "", itv_vence: "", tiene_gnc: "no",
  })
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [autoError, setAutoError] = useState<string | null>(null)

  // â”€â”€ Consignacion section state â”€â”€
  const [consigForm, setConsigForm] = useState({
    tipo: "fisica", exclusividad: "no", fecha_carga: "",
    duenio_nombre: "", duenio_apellido: "", duenio_dni: "",
    duenio_telefono: "", duenio_domicilio: "", observaciones: "",
  })
  const [consigSaving, setConsigSaving] = useState(false)
  const [consigSaved, setConsigSaved] = useState(false)
  const [consigError, setConsigError] = useState<string | null>(null)

  // â”€â”€ Verificacion section state â”€â”€
  const [verifForm, setVerifForm] = useState({
    estado: "pendiente", fecha: "", turno: "", responsable_id: "", observaciones: "",
  })
  const [verifSaving, setVerifSaving] = useState(false)
  const [verifSaved, setVerifSaved] = useState(false)
  const [verifError, setVerifError] = useState<string | null>(null)

  // â”€â”€ Informes state â”€â”€
  const [informeForms, setInformeForms] = useState<
    Record<string, { estado: string; aprobado: string; costo: string; pagado: string; observaciones: string }>
  >({})
  const [informeSaving, setInformeSaving] = useState<Record<string, boolean>>({})
  const [informeSaved, setInformeSaved] = useState<Record<string, boolean>>({})
  const [informeError, setInformeError] = useState<Record<string, string | null>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: row, error } = await fetchConsignacionById(autoId)
      setLoading(false)
      if (error || !row) {
        setLoadError("No se pudo cargar la consigna.")
        return
      }
      setData(row)
      // Populate auto form
      setAutoForm({
        dominio: row.dominio ?? "",
        marca: row.marca ?? "",
        modelo: row.modelo ?? "",
        version: row.version ?? "",
        anio: row.anio?.toString() ?? "",
        km: row.km?.toString() ?? "",
        color: row.color ?? "",
        combustible: row.combustible ?? "",
        precio_pretendido: row.precio_pretendido?.toString() ?? "",
        precio_publicado: row.precio_publicado?.toString() ?? "",
        calificacion_precio: row.calificacion_precio ?? "",
        responsable_id: row.responsable_id ?? "",
        estado: row.estado ?? "",
        ubicacion: row.ubicacion ?? "",
        estado_general: row.estado_general?.toString() ?? "",
        itv_vence: row.itv_vence ?? "",
        tiene_gnc: row.tiene_gnc === true ? "si" : "no",
      })
      // Populate consignacion form
      if (row.consignacion) {
        const c = row.consignacion as Consignacion
        setConsigForm({
          tipo: c.tipo ?? "fisica",
          exclusividad: c.exclusividad ? "si" : "no",
          fecha_carga: c.fecha_carga ?? "",
          duenio_nombre: c.duenio_nombre ?? "",
          duenio_apellido: c.duenio_apellido ?? "",
          duenio_dni: c.duenio_dni ?? "",
          duenio_telefono: c.duenio_telefono ?? "",
          duenio_domicilio: c.duenio_domicilio ?? "",
          observaciones: c.observaciones ?? "",
        })
      }
      // Populate verificacion form
      if (row.verificacion) {
        const v = row.verificacion as Verificacion
        setVerifForm({
          estado: v.estado ?? "pendiente",
          fecha: v.fecha ?? "",
          turno: v.turno ? v.turno.slice(0, 16) : "",
          responsable_id: v.responsable_id ?? "",
          observaciones: v.observaciones ?? "",
        })
      }
      // Populate informes forms
      const iforms: typeof informeForms = {}
      for (const inf of row.informes) {
        iforms[inf.id] = {
          estado: inf.estado ?? "pendiente",
          aprobado: inf.aprobado === true ? "si" : inf.aprobado === false ? "no" : "",
          costo: inf.costo?.toString() ?? "",
          pagado: inf.pagado === true ? "si" : inf.pagado === false ? "no" : "",
          observaciones: inf.observaciones ?? "",
        }
      }
      setInformeForms(iforms)
    }
    load()
  }, [autoId])

  useEffect(() => {
    if (!usuario?.agencia_id) return
    fetchUsuariosAgencia(usuario.agencia_id).then(setUsuarios)
  }, [usuario?.agencia_id])

  if (!usuario) return null

  const canEditAuto =
    usuario.rol !== "vendedor" &&
    usuario.rol !== "alistaje" &&
    (usuario.rol !== "consignatario" || data?.responsable_id === usuario.id)

  const canEditConsig = canEditAuto

  const canEditVerifInformes =
    usuario.rol !== "vendedor" &&
    usuario.rol !== "alistaje" &&
    usuario.rol !== "consignatario"

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function handleSaveAuto() {
    if (!data) return
    setAutoSaving(true)
    setAutoSaved(false)
    setAutoError(null)
    const pretendido = parsePrice(autoForm.precio_pretendido)
    const publicado = parsePrice(autoForm.precio_publicado)
    const { error } = await updateAuto(data.id, {
      dominio: autoForm.dominio.trim().toUpperCase() || undefined,
      marca: autoForm.marca.trim() || null,
      modelo: autoForm.modelo.trim() || null,
      version: autoForm.version.trim() || null,
      anio: autoForm.anio ? parseInt(autoForm.anio) : null,
      km: autoForm.km ? parseInt(autoForm.km.replace(/\./g, "")) : null,
      color: autoForm.color.trim() || null,
      combustible: autoForm.combustible || null,
      precio_pretendido: pretendido,
      precio_publicado: publicado,
      margen: pretendido !== null && publicado !== null ? publicado - pretendido : null,
      calificacion_precio: (autoForm.calificacion_precio || null) as "barato" | "bien" | "caro" | null,
      responsable_id: autoForm.responsable_id || null,
      estado: autoForm.estado as typeof data.estado,
      ubicacion: autoForm.ubicacion.trim() || null,
      estado_general: autoForm.estado_general ? parseInt(autoForm.estado_general) : null,
      itv_vence: autoForm.itv_vence || null,
      tiene_gnc: autoForm.tiene_gnc === "si",
    })
    setAutoSaving(false)
    if (error) { setAutoError("Error al guardar."); return }
    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 3000)
    // Update local data
    setData((prev) => prev ? ({ ...prev, ...data, dominio: autoForm.dominio.toUpperCase() }) : prev)
  }

  async function handleSaveConsig() {
    if (!data?.consignacion) return
    setConsigSaving(true)
    setConsigSaved(false)
    setConsigError(null)
    const { error } = await updateConsignacionRecord(data.consignacion.id, {
      tipo: consigForm.tipo as "fisica" | "virtual",
      exclusividad: consigForm.exclusividad === "si",
      fecha_carga: consigForm.fecha_carga || undefined,
      duenio_nombre: consigForm.duenio_nombre.trim() || null,
      duenio_apellido: consigForm.duenio_apellido.trim() || null,
      duenio_dni: consigForm.duenio_dni.trim() || null,
      duenio_telefono: consigForm.duenio_telefono.trim() || null,
      duenio_domicilio: consigForm.duenio_domicilio.trim() || null,
      observaciones: consigForm.observaciones.trim() || null,
    })
    setConsigSaving(false)
    if (error) { setConsigError("Error al guardar."); return }
    setConsigSaved(true)
    setTimeout(() => setConsigSaved(false), 3000)
  }

  async function handleSaveVerif() {
    if (!data?.verificacion) return
    setVerifSaving(true)
    setVerifSaved(false)
    setVerifError(null)
    const { error } = await updateVerificacion(data.verificacion.id, {
      estado: verifForm.estado as Verificacion["estado"],
      fecha: verifForm.fecha || null,
      turno: verifForm.turno ? new Date(verifForm.turno).toISOString() : null,
      responsable_id: verifForm.responsable_id || null,
      observaciones: verifForm.observaciones.trim() || null,
    })
    setVerifSaving(false)
    if (error) { setVerifError("Error al guardar."); return }
    setVerifSaved(true)
    setTimeout(() => setVerifSaved(false), 3000)
  }

  async function handleSaveInforme(informeId: string) {
    const f = informeForms[informeId]
    if (!f) return
    setInformeSaving((prev) => ({ ...prev, [informeId]: true }))
    setInformeSaved((prev) => ({ ...prev, [informeId]: false }))
    setInformeError((prev) => ({ ...prev, [informeId]: null }))
    const { error } = await updateInforme(informeId, {
      estado: f.estado as Informe["estado"],
      aprobado: f.aprobado === "si" ? true : f.aprobado === "no" ? false : null,
      costo: f.costo ? parsePrice(f.costo) : null,
      pagado: f.pagado === "si" ? true : f.pagado === "no" ? false : null,
      observaciones: f.observaciones.trim() || null,
    })
    setInformeSaving((prev) => ({ ...prev, [informeId]: false }))
    if (error) { setInformeError((prev) => ({ ...prev, [informeId]: "Error al guardar." })); return }
    setInformeSaved((prev) => ({ ...prev, [informeId]: true }))
    setTimeout(() => setInformeSaved((prev) => ({ ...prev, [informeId]: false })), 3000)
  }

  function setInformeField(informeId: string, field: string, val: string) {
    setInformeForms((prev) => ({
      ...prev,
      [informeId]: { ...prev[informeId], [field]: val },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">{loadError ?? "No encontrado."}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4 rounded-[10px]">
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/consignacion")}
          className="rounded-[10px] h-8 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground font-mono">
            {data.dominio || "â€”"}
            <span className="font-sans font-normal text-muted-foreground text-base ml-2">
              {data.marca} {data.modelo}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <EstadoChip estado={data.estado} />
            {data.consignacion && <TipoConsignaChip tipo={data.consignacion.tipo} />}
            {data.verificacion && <VerifChip estado={data.verificacion.estado} />}
          </div>
        </div>
      </div>

      {/* â”€â”€ SecciÃ³n: Auto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <SectionCard
        title="Datos del auto"
        footer={
          canEditAuto ? (
            <>
              <SaveStatus saving={autoSaving} saved={autoSaved} error={autoError} />
              <Button
                onClick={handleSaveAuto}
                disabled={autoSaving}
                size="sm"
                className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8"
              >
                Guardar
              </Button>
            </>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Dominio</Label>
            <Input
              value={autoForm.dominio}
              onChange={(e) => setAutoForm((p) => ({ ...p, dominio: e.target.value.toUpperCase() }))}
              disabled={!canEditAuto}
              className="font-mono uppercase rounded-[10px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select
              value={autoForm.estado || "activo"}
              onValueChange={(v) => setAutoForm((p) => ({ ...p, estado: v ?? "" }))}
              disabled={!canEditAuto}
            >
              <SelectTrigger className="rounded-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="por_ingresar">Por ingresar</SelectItem>
                <SelectItem value="en_alistaje">En alistaje</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="senado">SeÃ±ado</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Input value={autoForm.marca} onChange={(e) => setAutoForm((p) => ({ ...p, marca: capFirst(e.target.value) }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Input value={autoForm.modelo} onChange={(e) => setAutoForm((p) => ({ ...p, modelo: capFirst(e.target.value) }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label>VersiÃ³n</Label>
            <Input value={autoForm.version} onChange={(e) => setAutoForm((p) => ({ ...p, version: capFirst(e.target.value) }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>AÃ±o</Label>
            <Input type="number" value={autoForm.anio} onChange={(e) => setAutoForm((p) => ({ ...p, anio: e.target.value }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label>KilÃ³metros</Label>
            <Input value={autoForm.km} onChange={(e) => setAutoForm((p) => ({ ...p, km: e.target.value }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <Input value={autoForm.color} onChange={(e) => setAutoForm((p) => ({ ...p, color: capFirst(e.target.value) }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Combustible</Label>
            <Select value={autoForm.combustible || "none"} onValueChange={(v) => setAutoForm((p) => ({ ...p, combustible: v === "none" ? "" : (v ?? "") }))} disabled={!canEditAuto}>
              <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin especificar</SelectItem>
                <SelectItem value="nafta">Nafta</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="gnc">GNC</SelectItem>
                <SelectItem value="hibrido">HÃ­brido</SelectItem>
                <SelectItem value="electrico">ElÃ©ctrico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tiene GNC</Label>
            <Select value={autoForm.tiene_gnc} onValueChange={(v) => setAutoForm((p) => ({ ...p, tiene_gnc: v ?? "" }))} disabled={!canEditAuto}>
              <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="si">SÃ­</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Precio pretendido</Label>
            <Input
              value={autoForm.precio_pretendido}
              onChange={(e) => setAutoForm((p) => ({ ...p, precio_pretendido: e.target.value }))}
              disabled={!canEditAuto}
              className="rounded-[10px]"
            />
            {autoForm.precio_pretendido && (
              <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(autoForm.precio_pretendido))}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Precio publicado</Label>
            <Input
              value={autoForm.precio_publicado}
              onChange={(e) => setAutoForm((p) => ({ ...p, precio_publicado: e.target.value }))}
              disabled={!canEditAuto}
              className="rounded-[10px]"
            />
            {autoForm.precio_publicado && (
              <p className="text-xs text-muted-foreground">{formatPriceARS(parsePrice(autoForm.precio_publicado))}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>CalificaciÃ³n precio</Label>
            <Select value={autoForm.calificacion_precio || "none"} onValueChange={(v) => setAutoForm((p) => ({ ...p, calificacion_precio: v === "none" ? "" : (v ?? "") }))} disabled={!canEditAuto}>
              <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="Sin calificar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin calificar</SelectItem>
                <SelectItem value="barato">Barato</SelectItem>
                <SelectItem value="bien">Bien</SelectItem>
                <SelectItem value="caro">Caro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {usuarios.length > 0 && (
            <div className="space-y-1.5">
              <Label>Responsable</Label>
              <Select value={autoForm.responsable_id || "none"} onValueChange={(v) => setAutoForm((p) => ({ ...p, responsable_id: v === "none" ? "" : (v ?? "") }))} disabled={!canEditAuto}>
                <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>UbicaciÃ³n</Label>
            <Input value={autoForm.ubicacion} onChange={(e) => setAutoForm((p) => ({ ...p, ubicacion: capFirst(e.target.value) }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label>ITV vence</Label>
            <Input type="date" value={autoForm.itv_vence} onChange={(e) => setAutoForm((p) => ({ ...p, itv_vence: e.target.value }))} disabled={!canEditAuto} className="rounded-[10px]" />
          </div>
        </div>
      </SectionCard>

      {/* â”€â”€ SecciÃ³n: ConsignaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {data.consignacion && (
        <SectionCard
          title="Datos de la consignaciÃ³n"
          footer={
            canEditConsig ? (
              <>
                <SaveStatus saving={consigSaving} saved={consigSaved} error={consigError} />
                <Button
                  onClick={handleSaveConsig}
                  disabled={consigSaving}
                  size="sm"
                  className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8"
                >
                  Guardar
                </Button>
              </>
            ) : undefined
          }
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={consigForm.tipo} onValueChange={(v) => setConsigForm((p) => ({ ...p, tipo: v ?? "" }))} disabled={!canEditConsig}>
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">FÃ­sica</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Exclusividad</Label>
              <Select value={consigForm.exclusividad} onValueChange={(v) => setConsigForm((p) => ({ ...p, exclusividad: v ?? "" }))} disabled={!canEditConsig}>
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">SÃ­</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha carga</Label>
              <Input type="date" value={consigForm.fecha_carga} onChange={(e) => setConsigForm((p) => ({ ...p, fecha_carga: e.target.value }))} disabled={!canEditConsig} className="rounded-[10px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre del dueÃ±o</Label>
              <Input value={consigForm.duenio_nombre} onChange={(e) => setConsigForm((p) => ({ ...p, duenio_nombre: capFirst(e.target.value) }))} disabled={!canEditConsig} className="rounded-[10px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido del dueÃ±o</Label>
              <Input value={consigForm.duenio_apellido} onChange={(e) => setConsigForm((p) => ({ ...p, duenio_apellido: capFirst(e.target.value) }))} disabled={!canEditConsig} className="rounded-[10px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>DNI</Label>
              <Input value={consigForm.duenio_dni} onChange={(e) => setConsigForm((p) => ({ ...p, duenio_dni: e.target.value }))} disabled={!canEditConsig} className="rounded-[10px]" />
            </div>
            <div className="space-y-1.5">
              <Label>TelÃ©fono</Label>
              <Input value={consigForm.duenio_telefono} onChange={(e) => setConsigForm((p) => ({ ...p, duenio_telefono: e.target.value }))} disabled={!canEditConsig} className="rounded-[10px]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Domicilio</Label>
            <Input value={consigForm.duenio_domicilio} onChange={(e) => setConsigForm((p) => ({ ...p, duenio_domicilio: capFirst(e.target.value) }))} disabled={!canEditConsig} className="rounded-[10px]" />
          </div>

          <div className="space-y-1.5">
            <Label>Observaciones</Label>
            <Textarea value={consigForm.observaciones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConsigForm((p) => ({ ...p, observaciones: e.target.value }))} disabled={!canEditConsig} className="rounded-[10px] resize-none" rows={3} />
          </div>
        </SectionCard>
      )}

      {/* â”€â”€ SecciÃ³n: VerificaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {data.verificacion && (
        <SectionCard
          title="VerificaciÃ³n"
          footer={
            canEditVerifInformes ? (
              <>
                <SaveStatus saving={verifSaving} saved={verifSaved} error={verifError} />
                <Button
                  onClick={handleSaveVerif}
                  disabled={verifSaving}
                  size="sm"
                  className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8"
                >
                  Guardar
                </Button>
              </>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={verifForm.estado} onValueChange={(v) => setVerifForm((p) => ({ ...p, estado: v ?? "" }))} disabled={!canEditVerifInformes}>
                <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="turno_sacado">Turno sacado</SelectItem>
                  <SelectItem value="hecha">Hecha</SelectItem>
                  <SelectItem value="observada">Observada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={verifForm.fecha} onChange={(e) => setVerifForm((p) => ({ ...p, fecha: e.target.value }))} disabled={!canEditVerifInformes} className="rounded-[10px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Turno</Label>
              <Input type="datetime-local" value={verifForm.turno} onChange={(e) => setVerifForm((p) => ({ ...p, turno: e.target.value }))} disabled={!canEditVerifInformes} className="rounded-[10px]" />
            </div>
            {usuarios.length > 0 && (
              <div className="space-y-1.5">
                <Label>Responsable</Label>
                <Select value={verifForm.responsable_id || "none"} onValueChange={(v) => setVerifForm((p) => ({ ...p, responsable_id: v === "none" ? "" : (v ?? "") }))} disabled={!canEditVerifInformes}>
                  <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Observaciones</Label>
            <Textarea value={verifForm.observaciones} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVerifForm((p) => ({ ...p, observaciones: e.target.value }))} disabled={!canEditVerifInformes} className="rounded-[10px] resize-none" rows={2} />
          </div>
        </SectionCard>
      )}

      {/* â”€â”€ SecciÃ³n: Informes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {data.informes.length > 0 && (
        <SectionCard title="Informes">
          <div className="space-y-5">
            {data.informes.map((inf) => {
              const f = informeForms[inf.id]
              if (!f) return null
              return (
                <div key={inf.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
                      {inf.tipo === "dominio" ? "Informe de dominio" : "Informe de multas"}
                    </span>
                    <InformeEstadoChip tipo={inf.tipo} estado={inf.estado} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Estado</Label>
                      <Select value={f.estado} onValueChange={(v) => setInformeField(inf.id, "estado", v ?? "")} disabled={!canEditVerifInformes}>
                        <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="solicitado">Solicitado</SelectItem>
                          <SelectItem value="recibido">Recibido</SelectItem>
                          <SelectItem value="ok">OK</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Aprobado</Label>
                      <Select value={f.aprobado || "none"} onValueChange={(v) => setInformeField(inf.id, "aprobado", v === "none" ? "" : (v ?? ""))} disabled={!canEditVerifInformes}>
                        <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="Sin definir" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin definir</SelectItem>
                          <SelectItem value="si">SÃ­</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Costo</Label>
                      <Input
                        value={f.costo}
                        onChange={(e) => setInformeField(inf.id, "costo", e.target.value)}
                        disabled={!canEditVerifInformes}
                        placeholder="$ 0"
                        className="rounded-[10px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pagado</Label>
                      <Select value={f.pagado || "none"} onValueChange={(v) => setInformeField(inf.id, "pagado", v === "none" ? "" : (v ?? ""))} disabled={!canEditVerifInformes}>
                        <SelectTrigger className="rounded-[10px]"><SelectValue placeholder="Sin definir" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin definir</SelectItem>
                          <SelectItem value="si">SÃ­</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={f.observaciones}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInformeField(inf.id, "observaciones", e.target.value)}
                      disabled={!canEditVerifInformes}
                      className="rounded-[10px] resize-none"
                      rows={2}
                    />
                  </div>

                  {canEditVerifInformes && (
                    <div className="flex items-center justify-end gap-3">
                      <SaveStatus
                        saving={informeSaving[inf.id] ?? false}
                        saved={informeSaved[inf.id] ?? false}
                        error={informeError[inf.id] ?? null}
                      />
                      <Button
                        onClick={() => handleSaveInforme(inf.id)}
                        disabled={informeSaving[inf.id]}
                        size="sm"
                        className="rounded-[10px] bg-brand-500 hover:bg-brand-600 text-white h-8"
                      >
                        Guardar
                      </Button>
                    </div>
                  )}

                  {inf !== data.informes[data.informes.length - 1] && (
                    <div className="border-t border-dashed border-stone-200" />
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Sección: Gastos del vehículo ───────────────── */}
      <GastosAutoSection autoId={data.id} />
    </div>
  )
}
