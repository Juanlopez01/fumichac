import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import {
  calcularAvisos,
  DIAS_MAXIMOS_VENCIDO,
  hoyArgentina,
  sumarDias,
  type Aviso,
} from "@/lib/avisos/calcular";

const DIAS_ANTES_DE_VENCER = 30;

function faltantes(): string[] {
  return [
    "CRON_SECRET",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
  ].filter((nombre) => !process.env[nombre]);
}

async function leerDatos(supabase: SupabaseClient, hoy: string) {
  const [certificados, locales] = await Promise.all([
    supabase
      .from("certificados")
      .select("id, local_id, vencimiento, locales!inner(nombre)")
      .eq("archivado", false)
      .gte("vencimiento", sumarDias(hoy, -DIAS_MAXIMOS_VENCIDO))
      .lte("vencimiento", sumarDias(hoy, DIAS_ANTES_DE_VENCER))
      .returns<
        { id: string; local_id: string; vencimiento: string; locales: { nombre: string } }[]
      >(),
    supabase
      .from("locales_ultima_fumigacion")
      .select("id, nombre, frecuencia_dias, ultima_fumigacion")
      .not("frecuencia_dias", "is", null)
      .not("ultima_fumigacion", "is", null),
  ]);

  if (certificados.error) throw certificados.error;
  if (locales.error) throw locales.error;

  return {
    certificados: certificados.data.map((c) => ({
      id: c.id,
      local_id: c.local_id,
      local_nombre: c.locales.nombre,
      vencimiento: c.vencimiento,
    })),
    locales: locales.data,
  };
}

/** Guarda los avisos y devuelve solo los nuevos: los ya enviados chocan contra `clave`. */
async function guardarNuevos(supabase: SupabaseClient, avisos: Aviso[]): Promise<Aviso[]> {
  if (avisos.length === 0) return [];

  const { data, error } = await supabase
    .from("avisos")
    .upsert(avisos, { onConflict: "clave", ignoreDuplicates: true })
    .select("clave, tipo, local_id, certificado_id, titulo, cuerpo, url");

  if (error) throw error;
  return data as Aviso[];
}

async function enviarPush(supabase: SupabaseClient, avisos: Aviso[]) {
  if (avisos.length === 0) return { enviados: 0, fallidos: 0 };

  const { data: suscripciones, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (error) throw error;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  let enviados = 0;
  let fallidos = 0;
  const vencidas = new Set<string>();

  for (const aviso of avisos) {
    const payload = JSON.stringify({ title: aviso.titulo, body: aviso.cuerpo, url: aviso.url });
    const resultados = await Promise.allSettled(
      suscripciones.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        ),
      ),
    );

    resultados.forEach((resultado, i) => {
      if (resultado.status === "fulfilled") {
        enviados++;
        return;
      }
      fallidos++;
      // 404 y 410: el navegador dio de baja la suscripción.
      const { statusCode } = resultado.reason as { statusCode?: number };
      if (statusCode === 404 || statusCode === 410) vencidas.add(suscripciones[i].id);
      else console.error("Falló un envío push", resultado.reason);
    });
  }

  if (vencidas.size > 0) {
    const { error: errorBorrado } = await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", [...vencidas]);
    if (errorBorrado) console.error("No se pudieron borrar suscripciones", errorBorrado);
  }

  return { enviados, fallidos };
}

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const sinConfigurar = faltantes();
  if (sinConfigurar.length > 0) {
    return Response.json({ error: "Faltan variables", variables: sinConfigurar }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const hoy = hoyArgentina();
    const { certificados, locales } = await leerDatos(supabase, hoy);
    const nuevos = await guardarNuevos(supabase, calcularAvisos(hoy, certificados, locales));
    const push = await enviarPush(supabase, nuevos);

    return Response.json({ hoy, avisos_nuevos: nuevos.length, push });
  } catch (error) {
    console.error("Falló el cron de avisos", error);
    return Response.json({ error: "Falló el cron de avisos" }, { status: 500 });
  }
}
