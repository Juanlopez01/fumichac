import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Formulario } from "@/components/Formulario";
import { AreaTexto, Campo, Cargando, DatosDelLocal, Titulo } from "@/components/ui";
import { crearFumigacion } from "@/lib/acciones";
import { hoyArgentina } from "@/lib/avisos/calcular";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { data: local, error } = await supabase
    .from("locales")
    .select("nombre, direccion")
    .eq("id", id)
    .maybeSingle();
  if (error || !local) notFound();

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Nueva fumigación</Titulo>
      <DatosDelLocal nombre={local.nombre} direccion={local.direccion} />
      <Formulario accion={crearFumigacion.bind(null, id)} textoBoton="Guardar fumigación">
        <Campo etiqueta="Fecha" name="fecha" type="date" defaultValue={hoyArgentina()} required />
        <Campo etiqueta="Veneno utilizado" name="veneno" required />
        <Campo etiqueta="Quiénes fueron" name="operarios" required />
        <AreaTexto etiqueta="Anotaciones" name="anotaciones" />
      </Formulario>
    </>
  );
}
