import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CamposLocal } from "@/components/CamposLocal";
import { Formulario } from "@/components/Formulario";
import { Cargando, Titulo } from "@/components/ui";
import { editarLocal } from "@/lib/acciones";
import { createClient } from "@/lib/supabase/server";
import type { Local } from "@/lib/tipos";

type Parametros = PageProps<"/locales/[id]/editar">["params"];

export default function EditarLocal({ params }: PageProps<"/locales/[id]/editar">) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Parametros }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locales")
    .select("id, nombre, direccion, rubro, telefono, frecuencia_dias")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Editar local</Titulo>
      <Formulario accion={editarLocal.bind(null, id)} textoBoton="Guardar cambios">
        <CamposLocal local={data as Local} />
      </Formulario>
    </>
  );
}
