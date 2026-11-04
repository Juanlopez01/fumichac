-- Modelo base. Los campos propios de cada entidad se agregan en otra migración.
-- Por ahora, cualquier usuario autenticado ve y edita todo: todavía no hay roles.

create table public.locales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  -- Días desde la última fumigación hasta avisar. Null: no avisa.
  frecuencia_dias integer default 30 check (frecuencia_dias > 0),
  created_at timestamptz not null default now()
);

create table public.fumigaciones (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete restrict,
  fecha date not null,
  anotaciones text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, local_id)
);

create table public.certificados (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locales (id) on delete restrict,
  fumigacion_id uuid,
  vencimiento date not null,
  archivo_path text,
  -- Un certificado reemplazado se archiva para que deje de generar avisos.
  archivado boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- La fumigación tiene que ser del mismo local que el certificado.
  foreign key (fumigacion_id, local_id)
    references public.fumigaciones (id, local_id)
    on delete set null (fumigacion_id)
);

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  -- Identifica el aviso para no mandarlo dos veces.
  clave text not null unique,
  tipo text not null check (tipo in ('certificado', 'fumigacion')),
  local_id uuid not null references public.locales (id) on delete cascade,
  certificado_id uuid references public.certificados (id) on delete cascade,
  titulo text not null,
  cuerpo text not null,
  url text not null,
  leido_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index on public.fumigaciones (local_id, fecha desc);
create index on public.certificados (local_id);
create index on public.certificados (fumigacion_id);
create index on public.certificados (vencimiento) where not archivado;
create index on public.avisos (created_at desc);
create index on public.push_subscriptions (user_id);

create view public.locales_ultima_fumigacion
with (security_invoker = true) as
select
  l.id,
  l.nombre,
  l.frecuencia_dias,
  max(f.fecha) as ultima_fumigacion
from public.locales l
left join public.fumigaciones f on f.local_id = l.id
group by l.id;

alter table public.locales enable row level security;
alter table public.fumigaciones enable row level security;
alter table public.certificados enable row level security;
alter table public.avisos enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "autenticados gestionan locales" on public.locales
  for all to authenticated using (true) with check (true);

create policy "autenticados gestionan fumigaciones" on public.fumigaciones
  for all to authenticated using (true) with check (true);

create policy "autenticados gestionan certificados" on public.certificados
  for all to authenticated using (true) with check (true);

-- Los avisos los crea el cron. Desde la app solo se pueden leer y marcar como leídos.
create policy "autenticados leen avisos" on public.avisos
  for select to authenticated using (true);

create policy "autenticados marcan avisos" on public.avisos
  for update to authenticated using (true) with check (true);

revoke insert, update, delete on public.avisos from authenticated;
grant update (leido_at) on public.avisos to authenticated;

create policy "cada usuario gestiona sus suscripciones" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Archivos de certificados: bucket privado, hasta 10 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificados',
  'certificados',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

create policy "autenticados gestionan archivos de certificados" on storage.objects
  for all to authenticated
  using (bucket_id = 'certificados')
  with check (bucket_id = 'certificados');
