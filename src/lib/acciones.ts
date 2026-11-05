"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EstadoForm } from "@/lib/tipos";

const ERROR_GUARDAR = "No se pudo guardar. Probá de nuevo.";
const FK_VIOLADA = "23503";

function texto(datos: FormData, campo: string): string {
  const valor = datos.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function esFecha(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor));
}

function refrescar() {
  revalidatePath("/", "layout");
}

function leerLocal(datos: FormData) {
  const nombre = texto(datos, "nombre");
  const frecuencia = texto(datos, "frecuencia_dias");
  const frecuencia_dias = frecuencia === "" ? null : Number(frecuencia);

  if (!nombre) return { error: "Falta el apellido y nombre o la razón social." };
  if (frecuencia_dias !== null && (!Number.isInteger(frecuencia_dias) || frecuencia_dias < 1)) {
    return { error: "La frecuencia tiene que ser una cantidad de días mayor a 0." };
  }
  return {
    valores: {
      nombre,
      direccion: texto(datos, "direccion") || null,
      rubro: texto(datos, "rubro") || null,
      telefono: texto(datos, "telefono") || null,
      frecuencia_dias,
    },
  };
}

export async function iniciarSesion(_: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: texto(datos, "email"),
    password: String(datos.get("password") ?? ""),
  });
  if (error) return { error: "Mail o contraseña incorrectos." };

  refrescar();
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  refrescar();
  redirect("/login");
}

export async function crearLocal(_: EstadoForm, datos: FormData): Promise<EstadoForm> {
  const { valores, error: invalido } = leerLocal(datos);
  if (!valores) return { error: invalido };

  const supabase = await createClient();
  const { data, error } = await supabase.from("locales").insert(valores).select("id").single();
  if (error) return { error: ERROR_GUARDAR };

  refrescar();
  redirect(`/locales/${data.id}`);
}

export async function editarLocal(
  id: string,
  _: EstadoForm,
  datos: FormData,
): Promise<EstadoForm> {
  const { valores, error: invalido } = leerLocal(datos);
  if (!valores) return { error: invalido };

  const supabase = await createClient();
  const { error } = await supabase.from("locales").update(valores).eq("id", id);
  if (error) return { error: ERROR_GUARDAR };

  refrescar();
  redirect(`/locales/${id}`);
}

export async function borrarLocal(id: string): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase.from("locales").delete().eq("id", id);
  if (error?.code === FK_VIOLADA) {
    return { error: "No se puede borrar: el local tiene fumigaciones o certificados." };
  }
  if (error) return { error: "No se pudo borrar. Probá de nuevo." };

  refrescar();
  redirect("/locales");
}

export async function crearFumigacion(
  localId: string,
  _: EstadoForm,
  datos: FormData,
): Promise<EstadoForm> {
  const fecha = texto(datos, "fecha");
  const veneno = texto(datos, "veneno");
  const operarios = texto(datos, "operarios");
  if (!esFecha(fecha)) return { error: "Falta la fecha de la fumigación." };
  if (!veneno) return { error: "Falta el veneno utilizado." };
  if (!operarios) return { error: "Falta indicar quiénes fueron." };

  const supabase = await createClient();
  const { error } = await supabase.from("fumigaciones").insert({
    local_id: localId,
    fecha,
    veneno,
    operarios,
    anotaciones: texto(datos, "anotaciones") || null,
  });
  if (error) return { error: ERROR_GUARDAR };

  refrescar();
  redirect(`/locales/${localId}`);
}

export async function borrarFumigacion(id: string): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase.from("fumigaciones").delete().eq("id", id);
  if (error) return { error: "No se pudo borrar. Probá de nuevo." };

  refrescar();
  return {};
}

export async function registrarCertificado(certificado: {
  local_id: string;
  fumigacion_id: string | null;
  fecha: string;
  vencimiento: string;
  realizado_por: string;
  archivo_path: string | null;
}): Promise<EstadoForm> {
  if (!esFecha(certificado.fecha)) return { error: "Falta la fecha del certificado." };
  if (!esFecha(certificado.vencimiento)) return { error: "Falta la fecha de vencimiento." };
  if (certificado.vencimiento < certificado.fecha) {
    return { error: "El vencimiento no puede ser anterior a la fecha del certificado." };
  }
  if (!certificado.realizado_por.trim()) return { error: "Falta indicar quién lo hizo." };
  if (certificado.archivo_path && !certificado.archivo_path.startsWith(`${certificado.local_id}/`)) {
    return { error: "El archivo no corresponde a este local." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("certificados").insert(certificado);
  if (error) return { error: ERROR_GUARDAR };

  refrescar();
  redirect(`/locales/${certificado.local_id}`);
}

export async function cambiarArchivado(id: string, archivado: boolean): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase.from("certificados").update({ archivado }).eq("id", id);
  if (error) return { error: ERROR_GUARDAR };

  refrescar();
  return {};
}

export async function marcarAvisoLeido(id: string): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("avisos")
    .update({ leido_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: ERROR_GUARDAR };

  refrescar();
  return {};
}

export async function guardarSuscripcion(suscripcion: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(suscripcion, { onConflict: "endpoint" });
  return error ? { error: "No se pudieron activar los avisos." } : {};
}

export async function borrarSuscripcion(endpoint: string): Promise<EstadoForm> {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error ? { error: "No se pudieron desactivar los avisos." } : {};
}
