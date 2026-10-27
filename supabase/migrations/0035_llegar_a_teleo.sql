-- V.3.3.0 "Llegar a Teleo".
--
-- 1. Código de amistad (friend_code): uno por cuenta, fijo, como el código de amigo de Steam.
--    Se guarda sin prefijo ni guion ("K7MQ4XRA"); la app lo muestra como "TL-K7MQ-4XRA"
--    (src/lib/friendCode.ts). Ocho caracteres de un alfabeto sin los que se confunden
--    (0, O, 1, I, L). Se genera solo al crear la cuenta; las cuentas que ya existen reciben
--    uno acá. No se puede cambiar (trigger de abajo).
--
-- 2. Quién invitó a quién (invited_by): al registrarse con un enlace de invitación, Registro
--    manda el código en raw_user_meta_data->>'invite_code' y handle_new_user guarda el id de
--    la dueña. Si el código no existe, se ignora sin fallar. Tampoco se puede cambiar después.
--
-- 3. first_steps_hidden: la persona ocultó la tarjeta "Primeros pasos" de La mesa.
--
-- 4. Reglas del @usuario (decisión del 20 de octubre de 2026): solo minúsculas, números,
--    punto y guion bajo, entre 3 y 30 caracteres. Se revisan con un trigger y solo cuando el
--    @ es nuevo o cambia, así las cuentas actuales que no cumplen siguen funcionando (un
--    check fallaría al editar cualquier otra columna de esas cuentas). Un índice único sobre
--    lower(username) impide que "fiorella" se registre si ya existe "Fiorella".
--
-- 5. Funciones para pantallas sin acceso a otros perfiles (profiles solo deja ver el propio):
--    inviter_preview(code) para la portada con invitación (sin sesión) y
--    username_available(name) para el aviso en vivo de Registro y Cambiar usuario.

-- 1. Código de amistad ---------------------------------------------------------------------

create or replace function public.generate_friend_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where friend_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- Limpia lo que se escribe o llega en el enlace: mayúsculas, sin espacios ni guiones, sin el
-- prefijo "TL". Devuelve null si no queda un código de 8 caracteres válidos.
create or replace function public.normalize_friend_code(raw text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
begin
  if raw is null then
    return null;
  end if;
  cleaned := regexp_replace(upper(raw), '[^A-Z0-9]', '', 'g');
  if length(cleaned) = 10 and left(cleaned, 2) = 'TL' then
    cleaned := substr(cleaned, 3);
  end if;
  if cleaned ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$' then
    return cleaned;
  end if;
  return null;
end;
$$;

alter table profiles add column friend_code text;
update profiles set friend_code = public.generate_friend_code() where friend_code is null;
alter table profiles
  alter column friend_code set not null,
  alter column friend_code set default public.generate_friend_code(),
  add constraint profiles_friend_code_key unique (friend_code),
  add constraint profiles_friend_code_format check (friend_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$');

-- 2. Quién invitó --------------------------------------------------------------------------

alter table profiles add column invited_by uuid references profiles(id) on delete set null;

-- 3. Primeros pasos ------------------------------------------------------------------------

alter table profiles add column first_steps_hidden boolean not null default false;

-- El código y quién invitó son de la cuenta: nadie los cambia desde la app.
create or replace function public.protect_account_links()
returns trigger
language plpgsql
as $$
begin
  new.friend_code := old.friend_code;
  new.invited_by := old.invited_by;
  return new;
end;
$$;

create trigger trg_protect_account_links
  before update on profiles
  for each row execute function public.protect_account_links();

-- 4. Reglas del @usuario -------------------------------------------------------------------

create or replace function public.enforce_username_format()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or new.username is distinct from old.username then
    if new.username is null or new.username !~ '^[a-z0-9._]{3,30}$' then
      raise exception 'El nombre de usuario solo puede tener minúsculas, números, punto y guion bajo, entre 3 y 30 caracteres.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_username_format
  before insert or update of username on profiles
  for each row execute function public.enforce_username_format();

-- Falla si dos cuentas actuales tienen el mismo @ con distintas mayúsculas. Antes de aplicar
-- esta migración se revisa con la consulta que está en el plan de la 3.3.0.
create unique index profiles_username_lower_key on profiles (lower(username));

-- handle_new_user (antes en 0002): además del @usuario, guarda quién invitó.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inviter uuid;
begin
  select id into inviter
  from public.profiles
  where friend_code = public.normalize_friend_code(new.raw_user_meta_data->>'invite_code')
  limit 1;

  insert into public.profiles (id, username, invited_by)
  values (new.id, new.raw_user_meta_data->>'username', inviter);
  return new;
end;
$$;

-- 5. Funciones para pantallas --------------------------------------------------------------

-- Portada con invitación: solo lo que se muestra (nombre, @ y foto), nunca el id ni el correo.
create or replace function public.inviter_preview(code text)
returns table (username text, nickname text, avatar_url text)
language sql
stable
security definer set search_path = public
as $$
  select p.username, p.nickname, p.avatar_url
  from public.profiles p
  where p.friend_code = public.normalize_friend_code(code)
    and not p.is_deactivated
  limit 1;
$$;

-- Aviso en vivo del @usuario. Compara sin distinguir mayúsculas, igual que el índice.
create or replace function public.username_available(name text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(name))
  );
$$;

revoke all on function public.inviter_preview(text) from public;
revoke all on function public.username_available(text) from public;
grant execute on function public.inviter_preview(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
