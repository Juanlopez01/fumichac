import { Formulario } from "@/components/Formulario";
import { Campo } from "@/components/ui";
import { iniciarSesion } from "@/lib/acciones";

export default function Login() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Fumichac</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Ingresá con tu cuenta</p>
      </header>
      <Formulario accion={iniciarSesion} textoBoton="Ingresar">
        <Campo etiqueta="Mail" name="email" type="email" autoComplete="email" required />
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Formulario>
    </main>
  );
}
