-- Preferencias en la cuenta (V.3.7.2), antes de la mudanza a teleo.fiorers.dev (V.4.0.0).
--
-- Lo guardado en el dispositivo (localStorage) pertenece a la dirección: en el subdominio,
-- Teleo ya no puede leer lo que quedó en fiorers.dev/teleo. Por eso el modo y las marcas de
-- "ya visto" pasan a la cuenta antes de mudarse. También sirve para que sean los mismos en el
-- celular y en la computadora.
--
-- 1. profiles.theme_mode: claro, oscuro o sistema. null = este perfil todavía no lo subió desde
--    ningún dispositivo (el primero que abra la 3.7.2 lo sube).
-- 2. profiles.ui_marks: marcas de la app en un solo jsonb, así no hace falta una migración por
--    cada marca nueva. Claves: metaCelebrada, anuncioResumen, loTengoOfrecido, genreSuggest,
--    completeShelfSkipped, sortModes (ver src/lib/uiMarks.ts).
-- 3. La cuenta de visitante la comparte todo el mundo: la app no le escribe estas columnas y,
--    por si acaso, el trigger que protege la cuenta tampoco deja cambiarlas desde la API.

alter table profiles
  add column theme_mode text
    constraint profiles_theme_mode_valid check (theme_mode in ('light', 'dark', 'system')),
  add column ui_marks jsonb not null default '{}'::jsonb;

create or replace function public.protect_account_links()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.friend_code := old.friend_code;
    new.invited_by := old.invited_by;
    new.is_demo := old.is_demo;
    if old.is_demo then
      new.theme_mode := old.theme_mode;
      new.ui_marks := old.ui_marks;
    end if;
  end if;
  return new;
end;
$$;
