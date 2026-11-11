import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormularioCertificado } from "@/components/FormularioCertificado";
import { Cargando, DatosDelLocal, Titulo } from "@/components/ui";
import { hoyArgentina } from "@/lib/avisos/calcular";
import { createClient } from "@/lib/supabase/server";
import type { Certificado } from "@/lib/tipos";

type Props = PageProps<"/locales/[id]/certificados/[certificadoId]/editar">;

export default function EditarCertificado({ params }: Props) {
  return (
    <Suspense fallback={<Cargando />}>
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Props["params"] }) {
  const { id, certificadoId } = await params;
  const supabase = await createClient();
  const [local, certificado, fumigaciones] = await Promise.all([
    supabase.from("locales").select("nombre, direccion").eq("id", id).maybeSingle(),
    supabase
      .from("certificados")
      .select("id, local_id, fumigacion_id, fecha, vencimiento, realizado_por, precio, archivo_path, archivado")
      .eq("id", certificadoId)
      .eq("local_id", id)
      .maybeSingle(),
    supabase
      .from("fumigaciones")
      .select("id, fecha")
      .eq("local_id", id)
      .order("fecha", { ascending: false }),
  ]);
  if (local.error || !local.data || certificado.error || !certificado.data) notFound();
  if (fumigaciones.error) throw fumigaciones.error;

  return (
    <>
      <Titulo volver={`/locales/${id}`}>Editar certificado</Titulo>
      <DatosDelLocal nombre={local.data.nombre} direccion={local.data.direccion} />
      <FormularioCertificado
        localId={id}
        fumigaciones={fumigaciones.data}
        hoy={hoyArgentina()}
        certificado={certificado.data as Certificado}
      />
    </>
  );
}
