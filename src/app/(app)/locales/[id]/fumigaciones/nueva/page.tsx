import { connection } from "next/server";
import { Suspense } from "react";
import { Formulario } from "@/components/Formulario";
import { AreaTexto, Campo, Cargando, Titulo } from "@/components/ui";
import { crearFumigacion } from "@/lib/acciones";
import { hoyArgentina } from "@/lib/avisos/calcular";

type Parametros = PageProps<"/locales/[id]/fumigaciones/nueva">["params"];

export default function NuevaFumigacion({ params }: PageProps<"/locales/[id]/fumigaciones/nueva">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Parametros }) {
  const { id } = await params;
  // La fecha por defecto tiene que ser la del pedido, no la del build.
  await connection();

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Nueva fumigación</Titulo>
      <Formulario accion={crearFumigacion.bind(null, id)} textoBoton="Guardar fumigación">
        <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={hoyArgentina()} required />
        <AreaTexto etiqueta="Anotaciones" name="anotaciones" />
      </Formulario>
    </>
  );
}
