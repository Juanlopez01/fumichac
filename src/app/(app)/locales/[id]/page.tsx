import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonAccion } from "@/components/BotonAccion";
import {
  Cargando,
  claseBoton,
  claseBotonSecundario,
  Dato,
  Etiqueta,
  EtiquetaVencimiento,
  Seccion,
  Tarjeta,
  Titulo,
  Vacio,
} from "@/components/ui";
import { borrarFumigacion, borrarLocal, cambiarArchivado } from "@/lib/acciones";
import { diasEntre, formatearFecha, hoyArgentina } from "@/lib/avisos/calcular";
import { createClient } from "@/lib/supabase/server";
import type { Certificado, Fumigacion, Local } from "@/lib/tipos";

export default function DetalleLocal({ params }: PageProps<"/locales/[id]">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: PageProps<"/locales/[id]">["params"] }) {
  const { id } = await params;
  const supabase = await createClient();

  const [local, fumigaciones, certificados] = await Promise.all([
    supabase
      .from("locales")
      .select("id, nombre, direccion, rubro, telefono, frecuencia_dias")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("fumigaciones")
      .select("id, fecha, veneno, operarios, anotaciones")
      .eq("local_id", id)
      .order("fecha", { ascending: false }),
    supabase
      .from("certificados")
      .select("id, local_id, fumigacion_id, fecha, vencimiento, realizado_por, archivo_path, archivado")
      .eq("local_id", id)
      .order("vencimiento", { ascending: false }),
  ]);

  // Un id con formato inválido también llega acá como error de la base.
  if (local.error || !local.data) notFound();
  if (fumigaciones.error) throw fumigaciones.error;
  if (certificados.error) throw certificados.error;

  const { nombre, direccion, rubro, telefono, frecuencia_dias } = local.data as Local;
  const listaFumigaciones = fumigaciones.data as Fumigacion[];
  const listaCertificados = certificados.data as Certificado[];
  const fechaDeFumigacion = new Map(listaFumigaciones.map((f) => [f.id, f.fecha]));
  const hoy = hoyArgentina();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Titulo volver="/locales">{nombre}</Titulo>
        <Dato etiqueta="Dirección">{direccion}</Dato>
        <Dato etiqueta="Rubro">{rubro}</Dato>
        <Dato etiqueta="Teléfono">
          {telefono && (
            <a href={`tel:${telefono}`} className="text-green-800 underline dark:text-green-400">
              {telefono}
            </a>
          )}
        </Dato>
        <p className="text-zinc-600 dark:text-zinc-400">
          {frecuencia_dias
            ? `Avisa a los ${frecuencia_dias} días de la última fumigación`
            : "Sin aviso por tiempo desde la fumigación"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/locales/${id}/editar`} className={claseBotonSecundario}>
            Editar
          </Link>
          <BotonAccion
            accion={borrarLocal.bind(null, id)}
            confirmacion={`¿Borrar el local ${nombre}?`}
          >
            Borrar
          </BotonAccion>
        </div>
      </div>

      <Seccion
        titulo="Certificados"
        accion={
          <Link href={`/locales/${id}/certificados/nuevo`} className={claseBoton}>
            Agregar
          </Link>
        }
      >
        {listaCertificados.length === 0 && <Vacio>Todavía no hay certificados.</Vacio>}
        {listaCertificados.map((c) => {
          const fumigacion = c.fumigacion_id ? fechaDeFumigacion.get(c.fumigacion_id) : undefined;
          return (
            <Tarjeta key={c.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Vence {formatearFecha(c.vencimiento)}</span>
                {c.archivado ? (
                  <Etiqueta color="gris">Archivado</Etiqueta>
                ) : (
                  <EtiquetaVencimiento dias={diasEntre(hoy, c.vencimiento)} />
                )}
              </div>
              <Dato etiqueta="Fecha">{formatearFecha(c.fecha)}</Dato>
              <Dato etiqueta="Quién lo hizo">{c.realizado_por}</Dato>
              {fumigacion && (
                <p className="text-zinc-600 dark:text-zinc-400">
                  De la fumigación del {formatearFecha(fumigacion)}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {c.archivo_path && (
                  <a
                    href={`/certificados/${c.id}/archivo`}
                    target="_blank"
                    rel="noopener"
                    className={claseBotonSecundario}
                  >
                    Ver archivo
                  </a>
                )}
                <BotonAccion accion={cambiarArchivado.bind(null, c.id, !c.archivado)}>
                  {c.archivado ? "Restaurar" : "Archivar"}
                </BotonAccion>
              </div>
            </Tarjeta>
          );
        })}
      </Seccion>

      <Seccion
        titulo="Fumigaciones"
        accion={
          <Link href={`/locales/${id}/fumigaciones/nueva`} className={claseBoton}>
            Agregar
          </Link>
        }
      >
        {listaFumigaciones.length === 0 && <Vacio>Todavía no hay fumigaciones.</Vacio>}
        {listaFumigaciones.map((f) => (
          <Tarjeta key={f.id}>
            <span className="font-medium">{formatearFecha(f.fecha)}</span>
            <Dato etiqueta="Veneno utilizado">{f.veneno}</Dato>
            <Dato etiqueta="Quiénes fueron">{f.operarios}</Dato>
            <Dato etiqueta="Anotaciones">{f.anotaciones}</Dato>
            <div>
              <BotonAccion
                accion={borrarFumigacion.bind(null, f.id)}
                confirmacion={`¿Borrar la fumigación del ${formatearFecha(f.fecha)}?`}
              >
                Borrar
              </BotonAccion>
            </div>
          </Tarjeta>
        ))}
      </Seccion>
    </>
  );
}
