-- Fase 1 del plan de la nueva versión: nickname y espera más corta para cambiar el @.
--
-- nickname: nombre visible, libre (ej. @only.fiito se muestra como "Fiito"). A diferencia
-- del @usuario no tiene que ser único ni tiene espera para cambiarse. Nulo = sin nickname;
-- la app muestra el @usuario en su lugar y el saludo de Mesa queda sin nombre.
alter table profiles
  add column nickname text
  constraint profiles_nickname_length check (nickname is null or char_length(nickname) between 1 and 30);

-- La espera para cambiar el @usuario baja de 14 a 7 días (decisión del 23 de septiembre de
-- 2026). Mismo trigger de 0009, solo cambia el intervalo y el mensaje.
create or replace function public.enforce_username_cooldown()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null
       and now() - old.username_changed_at < interval '7 days' then
      raise exception 'Solo puedes cambiar tu nombre de usuario una vez cada 7 días.'
        using errcode = 'P0001';
    end if;
    new.username_changed_at := now();
  end if;
  return new;
end;
$$;
