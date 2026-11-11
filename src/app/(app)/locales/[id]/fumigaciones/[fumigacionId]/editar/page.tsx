import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CamposFumigacion } from "@/components/CamposFumigacion";
import { Formulario } from "@/components/Formulario";
import { Cargando, DatosDelLocal, Titulo } from "@/components/ui";
import { editarFumigacion } from "@/lib/acciones";
import { createClient } from "@/lib/supabase/server";
import type { Fumigacion } from "@/lib/tipos";

type Props = PageProps<"/locales/[id]/fumigaciones/[fumigacionId]/editar">;

export default function EditarFumigacion({ params }: Props) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Props["params"] }) {
  const { id, fumigacionId } = await params;
  const supabase = await createClient();
  const [local, fumigacion] = await Promise.all([
    supabase.from("locales").select("nombre, direccion").eq("id", id).maybeSingle(),
    supabase
      .from("fumigaciones")
      .select("id, fecha, veneno, operarios, precio, anotaciones")
      .eq("id", fumigacionId)
      .eq("local_id", id)
      .maybeSingle(),
  ]);
  if (local.error || !local.data || fumigacion.error || !fumigacion.data) notFound();

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Editar fumigación</Titulo>
      <DatosDelLocal nombre={local.data.nombre} direccion={local.data.direccion} />
      <Formulario
        accion={editarFumigacion.bind(null, fumigacionId, id)}
        textoBoton="Guardar cambios"
      >
        <CamposFumigacion fumigacion={fumigacion.data as Fumigacion} />
      </Formulario>
    </>
  );
}
