-- Cambios en vivo entre dispositivos (V.4.4.0 "Siempre al día").
--
-- Lo que se guarda en un dispositivo aparece solo en los demás que tengan Teleo abierto.
-- Cada cuenta tiene un canal privado de Realtime, 'user:<id>'. Cuando algo cambia en una de
-- sus tablas, la base de datos manda ahí un aviso chiquito con el nombre de la tabla, nunca
-- los datos. La app, al recibirlo, vuelve a pedir lo que está en pantalla con su RLS de
-- siempre (LiveSync).
--
-- Por qué así y no agregando las tablas a la publicación supabase_realtime (Postgres
-- Changes): ahí los borrados no se pueden filtrar ni pasan por RLS, así que cada borrado de
-- cualquier cuenta le llegaría a todas las personas conectadas.
--
-- El disparador es por sentencia, no por fila: una importación de cientos de libros manda
-- pocos avisos. Teleo siempre escribe con la sesión de la persona, así que auth.uid() dice de
-- quién es el cambio, también en los borrados y en las tablas sin user_id (book_tags,
-- custom_ratings, favorite_quotes). Sin sesión (por ejemplo, la función de borrar la cuenta)
-- no se manda nada. Si el aviso falla, el cambio se guarda igual.

create or replace function public.notify_live_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is not null then
    begin
      perform realtime.send(
        jsonb_build_object('table', tg_table_name),
        'cambio',
        'user:' || uid::text,
        true
      );
    exception when others then
      null;
    end;
  end if;
  return null;
end;
$$;

revoke all on function public.notify_live_change() from public, anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'books', 'sagas', 'reading_history', 'reviews', 'favorite_quotes', 'profiles',
    'reading_sessions', 'releases', 'reading_goals', 'period_favorites', 'custom_ratings',
    'book_tags'
  ] loop
    execute format('drop trigger if exists live_change on public.%I', t);
    execute format(
      'create trigger live_change after insert or update or delete on public.%I '
      'for each statement execute function public.notify_live_change()',
      t
    );
  end loop;
end;
$$;

-- Solo la dueña o el dueño de la cuenta puede escuchar su canal.
drop policy if exists "Cada cuenta escucha su canal" on realtime.messages;
create policy "Cada cuenta escucha su canal"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() = 'user:' || (select auth.uid())::text
);
