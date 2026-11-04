import Link from "next/link";
import { Suspense } from "react";
import { BotonAccion } from "@/components/BotonAccion";
import { ActivarAvisos } from "@/components/pwa/ActivarAvisos";
import {
  Cargando,
  Etiqueta,
  EtiquetaVencimiento,
  Seccion,
  Tarjeta,
  Titulo,
  Vacio,
} from "@/components/ui";
import { marcarAvisoLeido } from "@/lib/acciones";
import { diasEntre, formatearFecha, hoyArgentina, sumarDias } from "@/lib/avisos/calcular";
import { createClient } from "@/lib/supabase/server";
import type { AvisoGuardado } from "@/lib/tipos";

type Vencimiento = {
  id: string;
  local_id: string;
  vencimiento: string;
  locales: { nombre: string };
};

type LocalConFumigacion = {
  id: string;
  nombre: string;
  frecuencia_dias: number;
  ultima_fumigacion: string;
};

export default function Inicio() {
  return (
    <>
      <Titulo>Inicio</Titulo>
      <ActivarAvisos compacto />
      <Suspense fallback={<Cargando />}>
        <Contenido />
      </Suspense>
    </>
  );
}

async function Contenido() {
  const supabase = await createClient();
  const hoy = hoyArgentina();

  const [avisos, vencimientos, locales] = await Promise.all([
    supabase
      .from("avisos")
      .select("id, titulo, cuerpo, url, created_at")
      .is("leido_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("certificados")
      .select("id, local_id, vencimiento, locales!inner(nombre)")
      .eq("archivado", false)
      .lte("vencimiento", sumarDias(hoy, 30))
      .order("vencimiento"),
    supabase
      .from("locales_ultima_fumigacion")
      .select("id, nombre, frecuencia_dias, ultima_fumigacion")
      .not("frecuencia_dias", "is", null)
      .not("ultima_fumigacion", "is", null),
  ]);

  if (avisos.error) throw avisos.error;
  if (vencimientos.error) throw vencimientos.error;
  if (locales.error) throw locales.error;

  const porFumigar = (locales.data as LocalConFumigacion[])
    .map((l) => ({ ...l, dias: diasEntre(l.ultima_fumigacion, hoy) }))
    .filter((l) => l.dias >= l.frecuencia_dias)
    .sort((a, b) => b.dias - b.frecuencia_dias - (a.dias - a.frecuencia_dias));

  return (
    <>
      {avisos.data.length > 0 && (
        <Seccion titulo="Avisos sin leer">
          {(avisos.data as AvisoGuardado[]).map((aviso) => (
            <Tarjeta key={aviso.id}>
              <Link href={aviso.url} className="font-medium underline-offset-2 hover:underline">
                {aviso.titulo}
              </Link>
              <p className="text-zinc-600 dark:text-zinc-400">{aviso.cuerpo}</p>
              <BotonAccion accion={marcarAvisoLeido.bind(null, aviso.id)}>
                Marcar como leído
              </BotonAccion>
            </Tarjeta>
          ))}
        </Seccion>
      )}

      <Seccion titulo="Certificados por vencer">
        {vencimientos.data.length === 0 && <Vacio>Ninguno en los próximos 30 días.</Vacio>}
        {(vencimientos.data as unknown as Vencimiento[]).map((c) => (
          <Link key={c.id} href={`/locales/${c.local_id}`}>
            <Tarjeta>
              <span className="font-medium">{c.locales.nombre}</span>
              <div className="flex flex-wrap items-center gap-2">
                <EtiquetaVencimiento dias={diasEntre(hoy, c.vencimiento)} />
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatearFecha(c.vencimiento)}
                </span>
              </div>
            </Tarjeta>
          </Link>
        ))}
      </Seccion>

      <Seccion titulo="Locales por fumigar">
        {porFumigar.length === 0 && <Vacio>Ninguno por ahora.</Vacio>}
        {porFumigar.map((l) => (
          <Link key={l.id} href={`/locales/${l.id}`}>
            <Tarjeta>
              <span className="font-medium">{l.nombre}</span>
              <div className="flex flex-wrap items-center gap-2">
                <Etiqueta color="ambar">Hace {l.dias} días</Etiqueta>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Última: {formatearFecha(l.ultima_fumigacion)}
                </span>
              </div>
            </Tarjeta>
          </Link>
        ))}
      </Seccion>
    </>
  );
}
