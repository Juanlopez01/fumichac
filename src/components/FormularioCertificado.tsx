"use client";

import { useState, type FormEvent } from "react";
import { Campo, claseBoton, MensajeError, Selector } from "@/components/ui";
import { formatearFecha } from "@/lib/avisos/calcular";
import { registrarCertificado } from "@/lib/acciones";
import { createClient } from "@/lib/supabase/client";
import type { Fumigacion } from "@/lib/tipos";

const EXTENSIONES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

const TAMANIO_MAXIMO = 10 * 1024 * 1024;

type Props = {
  localId: string;
  fumigaciones: Pick<Fumigacion, "id" | "fecha">[];
};

export function FormularioCertificado({ localId, fumigaciones }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const archivo = datos.get("archivo") as File | null;
    const hayArchivo = archivo !== null && archivo.size > 0;

    if (hayArchivo && !EXTENSIONES[archivo.type]) {
      setError("El archivo tiene que ser PDF o imagen (JPG, PNG, WEBP o HEIC).");
      return;
    }
    if (hayArchivo && archivo.size > TAMANIO_MAXIMO) {
      setError("El archivo no puede superar los 10 MB.");
      return;
    }

    setEnviando(true);
    setError(undefined);

    // El archivo va directo a Storage: las server actions tienen un límite de tamaño bajo.
    const supabase = createClient();
    let ruta: string | null = null;

    if (hayArchivo) {
      ruta = `${localId}/${crypto.randomUUID()}.${EXTENSIONES[archivo.type]}`;
      const { error: errorSubida } = await supabase.storage
        .from("certificados")
        .upload(ruta, archivo, { contentType: archivo.type });

      if (errorSubida) {
        setError("No se pudo subir el archivo. Probá de nuevo.");
        setEnviando(false);
        return;
      }
    }

    const resultado = await registrarCertificado({
      local_id: localId,
      fumigacion_id: String(datos.get("fumigacion_id") ?? "") || null,
      vencimiento: String(datos.get("vencimiento") ?? ""),
      archivo_path: ruta,
    });

    // Si salió bien, la acción ya redirigió.
    if (resultado?.error) {
      if (ruta) await supabase.storage.from("certificados").remove([ruta]);
      setError(resultado.error);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Campo etiqueta="Fecha de vencimiento" name="vencimiento" type="date" required />
      <Selector etiqueta="Fumigación relacionada" name="fumigacion_id" defaultValue="">
        <option value="">Ninguna</option>
        {fumigaciones.map((f) => (
          <option key={f.id} value={f.id}>
            {formatearFecha(f.fecha)}
          </option>
        ))}
      </Selector>
      <Campo
        etiqueta="Archivo"
        ayuda="PDF o foto, hasta 10 MB."
        name="archivo"
        type="file"
        accept={Object.keys(EXTENSIONES).join(",")}
      />
      {error && <MensajeError>{error}</MensajeError>}
      <button type="submit" disabled={enviando} className={claseBoton}>
        {enviando ? "Guardando…" : "Guardar certificado"}
      </button>
    </form>
  );
}
