// Crea usuarios con contraseña nombre + "fumichac" (por ejemplo, anafumichac).
//
//   node --env-file=.env.local scripts/crear-usuarios.mjs ana pedro
//   node --env-file=.env.local scripts/crear-usuarios.mjs --resetear ana
//
// Los mails no existen (ana@fumichac.local) y solo sirven para entrar a la app. Como no reciben
// correo, --resetear vuelve a poner la contraseña con ese formato.

import { createClient } from "@supabase/supabase-js";

const DOMINIO = "fumichac.local";
const SUFIJO = "fumichac";

const argumentos = process.argv.slice(2);
const resetear = argumentos.includes("--resetear");
const nombres = argumentos.filter((a) => a !== "--resetear").map((n) => n.trim().toLowerCase());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;

if (!url || !secreta) {
  console.error("Faltan variables. Corrélo con --env-file=.env.local");
  process.exit(1);
}
if (nombres.length === 0 || nombres.some((n) => !/^[a-z0-9._-]+$/.test(n))) {
  console.error("Pasá los nombres en minúscula, sin acentos ni espacios: stella diego ...");
  process.exit(1);
}

const supabase = createClient(url, secreta, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) {
  console.error("No se pudo conectar:", error.message);
  process.exit(1);
}
const existentes = new Map(data.users.map((u) => [u.email, u.id]));

console.log(`Proyecto: ${url}\n`);
let fallas = 0;

for (const nombre of nombres) {
  const email = `${nombre}@${DOMINIO}`;
  const id = existentes.get(email);
  const password = `${nombre}${SUFIJO}`;

  if (id && !resetear) {
    console.log(`${email}  ya existe, no se tocó`);
    continue;
  }
  if (!id && resetear) {
    console.log(`${email}  no existe`);
    fallas++;
    continue;
  }

  const { error: fallo } = id
    ? await supabase.auth.admin.updateUserById(id, { password })
    : await supabase.auth.admin.createUser({ email, password, email_confirm: true });

  if (fallo) {
    console.log(`${email}  ERROR: ${fallo.message}`);
    fallas++;
  } else {
    console.log(`${email}  ${password}`);
  }
}

// Sin process.exit: en Windows corta conexiones abiertas y Node aborta con un error de libuv.
process.exitCode = fallas > 0 ? 1 : 0;
