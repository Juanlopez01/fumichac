-- Campos reales de la empresa. Nombre o razón social, dirección, rubro y teléfono
-- son del local; certificados y fumigaciones los toman de ahí.

alter table public.locales
  add column rubro text,
  add column telefono text;

alter table public.fumigaciones
  add column veneno text,
  add column operarios text;

alter table public.certificados
  add column fecha date,
  add column realizado_por text;

-- Los certificados ya cargados no tienen fecha propia: se usa la de carga.
update public.certificados
set fecha = least(created_at::date, vencimiento);

alter table public.certificados
  alter column fecha set not null,
  add constraint certificados_vencimiento_posterior check (vencimiento >= fecha);
