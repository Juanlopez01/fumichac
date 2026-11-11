"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { CamposFumigacion } from "@/components/CamposFumigacion";
import { CamposLocal } from "@/components/CamposLocal";
import { Formulario } from "@/components/Formulario";
import { FormularioCertificado } from "@/components/FormularioCertificado";
import {
  Cargando,
  claseBoton,
  claseBotonSecundario,
  Dato,
  DatosDelLocal,
  MensajeError,
  Tarjeta,
} from "@/components/ui";
import { crearFumigacion, fumigacionesDelLocal, guardarLocal } from "@/lib/acciones";
import { buscarCoincidencias } from "@/lib/buscar";
import type { Fumigacion, Local } from "@/lib/tipos";
import { usePaginaLista } from "@/lib/usePaginaLista";

type Tipo = "certificado" | "fumigacion";
type Paso = "local" | "confirmar" | "datos";
type LocalElegido = Pick<Local, "id" | "nombre" | "direccion">;

const MAXIMO_SUGERENCIAS = 5;

function descripcion(local: Pick<Local, "nombre" | "direccion">) {
  return local.direccion ? `${local.nombre} — ${local.direccion}` : local.nombre;
}

/**
 * Primero el local: si ya hay uno parecido se ofrece vincularlo, si no se pregunta si guardarlo.
 * Después, el certificado o la fumigación de ese local.
 */
export function CargaGuiada({ tipo, locales, hoy }: { tipo: Tipo; locales: Local[]; hoy: string }) {
  const [paso, setPaso] = useState<Paso>("local");
  const [cargado, setCargado] = useState({ nombre: "", direccion: "" });
  const [borrador, setBorrador] = useState<FormData | null>(null);
  const [elegido, setElegido] = useState<LocalElegido | null>(null);
  const [error, setError] = useState<string>();
  const [guardando, iniciar] = useTransition();
  const lista = usePaginaLista();

  const coincidencias = useMemo(
    () => buscarCoincidencias(locales, cargado).slice(0, MAXIMO_SUGERENCIAS),
    [locales, cargado],
  );

  function leer(formulario: HTMLFormElement) {
    const datos = new FormData(formulario);
    setCargado({
      nombre: String(datos.get("nombre") ?? ""),
      direccion: String(datos.get("direccion") ?? ""),
    });
  }

  function continuar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBorrador(new FormData(evento.currentTarget));
    setError(undefined);
    setPaso("confirmar");
  }

  function vincular(local: LocalElegido) {
    setElegido(local);
    setPaso("datos");
  }

  function guardarNuevo() {
    if (!borrador) return;
    iniciar(async () => {
      const resultado = await guardarLocal(borrador);
      if (!resultado.id) {
        setError(resultado.error ?? "No se pudo guardar el local.");
        return;
      }
      vincular({
        id: resultado.id,
        nombre: String(borrador.get("nombre") ?? "").trim(),
        direccion: String(borrador.get("direccion") ?? "").trim() || null,
      });
    });
  }

  function cambiarLocal() {
    setElegido(null);
    setPaso("local");
  }

  return (
    <>
      {/* El formulario queda montado aunque esté oculto, para no perder lo escrito al volver. */}
      <form
        method="post"
        onInput={(evento) => leer(evento.currentTarget)}
        onSubmit={continuar}
        className={paso === "local" ? "flex flex-col gap-4" : "hidden"}
      >
        <h2 className="text-lg font-semibold">Datos del local</h2>
        <CamposLocal />
        {coincidencias.length > 0 && (
          <Tarjeta>
            <p className="font-medium">Ya hay un local parecido. ¿Es alguno de estos?</p>
            {coincidencias.map((local) => (
              <div key={local.id} className="flex items-center justify-between gap-3">
                <span>{descripcion(local)}</span>
                <button
                  type="button"
                  onClick={() => vincular(local)}
                  className={`${claseBotonSecundario} shrink-0`}
                >
                  Usar este
                </button>
              </div>
            ))}
          </Tarjeta>
        )}
        <button type="submit" disabled={!lista} className={claseBoton}>
          Continuar
        </button>
      </form>

      {paso === "confirmar" && borrador && (
        <Tarjeta>
          {coincidencias.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold">¿Querés vincularlo con este negocio?</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Ya hay locales guardados con un nombre o una dirección parecidos.
              </p>
              {coincidencias.map((local) => (
                <button
                  key={local.id}
                  type="button"
                  onClick={() => vincular(local)}
                  className={claseBoton}
                >
                  Sí, vincular con {descripcion(local)}
                </button>
              ))}
              <button
                type="button"
                onClick={guardarNuevo}
                disabled={guardando}
                className={claseBotonSecundario}
              >
                {guardando ? "Guardando…" : "No, es otro: guardarlo como local nuevo"}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold">¿Querés guardar este local?</h2>
              <Dato etiqueta="Apellido y nombre / Razón social">
                {String(borrador.get("nombre") ?? "")}
              </Dato>
              <Dato etiqueta="Dirección">{String(borrador.get("direccion") ?? "")}</Dato>
              <Dato etiqueta="Rubro">{String(borrador.get("rubro") ?? "")}</Dato>
              <Dato etiqueta="Teléfono">{String(borrador.get("telefono") ?? "")}</Dato>
              <button type="button" onClick={guardarNuevo} disabled={guardando} className={claseBoton}>
                {guardando ? "Guardando…" : "Sí, guardar local"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setPaso("local")}
            disabled={guardando}
            className={claseBotonSecundario}
          >
            Volver a editar
          </button>
          {error && <MensajeError>{error}</MensajeError>}
        </Tarjeta>
      )}

      {paso === "datos" && elegido && (
        <>
          <DatosDelLocal nombre={elegido.nombre} direccion={elegido.direccion} />
          <button type="button" onClick={cambiarLocal} className={claseBotonSecundario}>
            Cambiar local
          </button>
          <h2 className="text-lg font-semibold">
            {tipo === "certificado" ? "Datos del certificado" : "Datos de la fumigación"}
          </h2>
          {tipo === "certificado" ? (
            <DatosCertificado localId={elegido.id} hoy={hoy} />
          ) : (
            <Formulario accion={crearFumigacion.bind(null, elegido.id)} textoBoton="Guardar fumigación">
              <CamposFumigacion hoy={hoy} />
            </Formulario>
          )}
        </>
      )}
    </>
  );
}

function DatosCertificado({ localId, hoy }: { localId: string; hoy: string }) {
  const [fumigaciones, setFumigaciones] = useState<Pick<Fumigacion, "id" | "fecha">[] | null>(null);

  useEffect(() => {
    // Un local recién guardado no tiene fumigaciones; si falla la lectura, se puede cargar sin vincular.
    fumigacionesDelLocal(localId).then(setFumigaciones, () => setFumigaciones([]));
  }, [localId]);

  if (!fumigaciones) return <Cargando />;
  return <FormularioCertificado localId={localId} fumigaciones={fumigaciones} hoy={hoy} />;
}
