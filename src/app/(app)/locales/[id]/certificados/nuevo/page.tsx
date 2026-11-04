import { Suspense } from "react";
import { FormularioCertificado } from "@/components/FormularioCertificado";
import { Cargando, Titulo } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

type Parametros = PageProps<"/locales/[id]/certificados/nuevo">["params"];

export default function NuevoCertificado({ params }: PageProps<"/locales/[id]/certificados/nuevo">) {
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
    .from("fumigaciones")
    .select("id, fecha")
    .eq("local_id", id)
    .order("fecha", { ascending: false });
  if (error) throw error;

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Nuevo certificado</Titulo>
      <FormularioCertificado localId={id} fumigaciones={data} />
    </>
  );
}
