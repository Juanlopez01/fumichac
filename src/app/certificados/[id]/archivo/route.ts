import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SEGUNDOS_DE_VALIDEZ = 60;

export async function GET(_: Request, { params }: RouteContext<"/certificados/[id]/archivo">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: certificado } = await supabase
    .from("certificados")
    .select("archivo_path")
    .eq("id", id)
    .maybeSingle();

  if (!certificado?.archivo_path) {
    return new NextResponse("Archivo no encontrado", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("certificados")
    .createSignedUrl(certificado.archivo_path, SEGUNDOS_DE_VALIDEZ);

  if (error) return new NextResponse("No se pudo abrir el archivo", { status: 500 });

  return NextResponse.redirect(data.signedUrl);
}
