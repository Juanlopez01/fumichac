import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormularioCertificado } from "@/components/FormularioCertificado";
import { Cargando, DatosDelLocal, Titulo } from "@/components/ui";
import { hoyArgentina } from "@/lib/avisos/calcular";
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
  const [local, fumigaciones] = await Promise.all([
    supabase.from("locales").select("nombre, direccion").eq("id", id).maybeSingle(),
    supabase
      .from("fumigaciones")
      .select("id, fecha")
      .eq("local_id", id)
      .order("fecha", { ascending: false }),
  ]);
  if (local.error || !local.data) notFound();
  if (fumigaciones.error) throw fumigaciones.error;

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Nuevo certificado</Titulo>
      <DatosDelLocal nombre={local.data.nombre} direccion={local.data.direccion} />
      <FormularioCertificado localId={id} fumigaciones={fumigaciones.data} hoy={hoyArgentina()} />
    </>
  );
}
