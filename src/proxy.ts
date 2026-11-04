import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase y manda a /login a quien no la tenga.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return new NextResponse("Faltan las variables de Supabase", { status: 500 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const enLogin = request.nextUrl.pathname === "/login";
  if (user && !enLogin) return response;
  if (!user && enLogin) return response;

  const destino = request.nextUrl.clone();
  destino.pathname = user ? "/" : "/login";
  destino.search = "";

  const redireccion = NextResponse.redirect(destino);
  response.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}

export const config = {
  // El cron se autentica con CRON_SECRET, no con sesión.
  matcher: [
    "/((?!api/cron|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|svg|ico)$).*)",
  ],
};
