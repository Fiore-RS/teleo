-- 1. Columna desnormalizada para evitar la recursion RLS entre books y reviews
alter table books add column is_recommended boolean not null default false;

-- 2. Funcion + trigger que mantiene la columna sincronizada
create function sync_book_is_recommended()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    update books set is_recommended = false where id = old.book_id;
    return old;
  else
    update books set is_recommended = coalesce(new.recommends, false) where id = new.book_id;
    return new;
  end if;
end;
$$;

create trigger trg_sync_book_is_recommended
  after insert or update or delete on reviews
  for each row execute function sync_book_is_recommended();

-- 3. Reemplazar la politica de books para que use la columna, no una subconsulta a reviews
drop policy "visitante ve libros segun toggles del perfil" on books;

create policy "visitante ve libros segun toggles del perfil"
  on books for select
  using (
    exists (
      select 1 from profiles p
      where p.id = books.user_id
      and (
        (books.status = 'leyendo' and p.show_currently_reading)
        or (books.is_favorite and p.show_favorites)
        or (books.status = 'deseado' and p.show_wishlist)
        or (books.is_recommended and p.show_recommended)
      )
    )
  );