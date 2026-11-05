# Fumichac

PWA para una empresa de fumigación: locales, fumigaciones con anotaciones, certificados con archivo y avisos de vencimiento.

## Puesta en marcha

1. Crear el proyecto en Supabase y correr, en orden, los archivos de `supabase/migrations/`.
2. **Desactivar el registro público** en Authentication > Sign In / Providers. Todo usuario logueado ve y edita todos los datos, así que las cuentas se crean solo desde el panel de Supabase.
3. Copiar `.env.example` a `.env.local` y completarlo. Las claves de push se generan con `npx web-push generate-vapid-keys`; `VAPID_SUBJECT` es un `mailto:` de contacto.
4. Correr `npm install` y `npm run dev`.

En Vercel hay que cargar las mismas variables. El cron de `vercel.json` llama a `/api/cron/avisos` todos los días a las 8 de Argentina.

## Comandos

- `npm run dev`: servidor local
- `npm test`: tests
- `npm run lint`: lint
- `npm run build`: build de producción
