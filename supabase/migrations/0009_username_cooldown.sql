alter table profiles add column username_changed_at timestamptz;

create or replace function public.enforce_username_cooldown()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    if old.username_changed_at is not null
       and now() - old.username_changed_at < interval '14 days' then
      raise exception 'Solo puedes cambiar tu nombre de usuario una vez cada 14 días.'
        using errcode = 'P0001';
    end if;
    new.username_changed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_username_cooldown
  before update on profiles
  for each row execute function public.enforce_username_cooldown();