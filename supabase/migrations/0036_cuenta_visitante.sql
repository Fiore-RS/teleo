-- V.3.3.0 "Llegar a Teleo": cuenta de visitante.
--
-- Una cuenta compartida (teleo@fiorers.dev / teleo123, publicada en el portafolio de Fiorella)
-- para probar Teleo sin registrarse. Se crea a mano en el panel de Supabase (Authentication ›
-- Add user, con "Auto confirm") DESPUÉS de aplicar esta migración (antes, el registro de la 0035
-- la rechazaría por llegar sin @usuario). Después se marca y se carga desde el SQL editor:
--   update profiles set is_demo = true
--   where id = (select id from auth.users where email = 'teleo@fiorers.dev');
--   select public.reset_demo_account();
--
-- 1. profiles.is_demo: true solo para esa cuenta. La app oculta lo de cuenta, importar, borrar,
--    invitar y subir imágenes, y muestra la franja "Estás en la cuenta de prueba".
-- 2. La cuenta de visitante no cuenta como quien invita, ni sale en la portada con invitación.
-- 3. reset_demo_account(): borra lo de la cuenta y vuelve a cargar la biblioteca de muestra
--    (clásicos de dominio público), con fechas calculadas desde el día en que corre (así la
--    racha y el resumen del mes siempre se ven vivos). También restablece la contraseña.
--    pg_cron la corre cada noche a las 2:00 de Costa Rica (8:00 UTC).
-- 4. Limpieza: se borra profiles.first_steps_hidden (0035), sin uso desde que se quitó
--    "Primeros pasos" (22 oct 2026).
-- 5. handle_new_user: si una cuenta llega sin @usuario válido (por ejemplo creada desde el panel
--    de Supabase), recibe uno provisional en vez de fallar.

-- 4. Limpieza -------------------------------------------------------------------------------
alter table profiles drop column if exists first_steps_hidden;

-- 1. Marca de visitante ---------------------------------------------------------------------
alter table profiles add column is_demo boolean not null default false;

-- El código, quién invitó y la marca de visitante no se cambian desde la app. Solo se frenan
-- los cambios que llegan por la API con una sesión (o sin ella); desde el SQL editor o una
-- migración (rol postgres, sin JWT) sí se pueden cambiar, por ejemplo para marcar la cuenta de
-- visitante.
create or replace function public.protect_account_links()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.friend_code := old.friend_code;
    new.invited_by := old.invited_by;
    new.is_demo := old.is_demo;
  end if;
  return new;
end;
$$;

-- Si la cuenta de visitante ya existe, se marca acá. Si se crea después, se marca a mano desde
-- el SQL editor (ver el plan de la 3.3.0).
update profiles set is_demo = true
where id = (select id from auth.users where email = 'teleo@fiorers.dev' limit 1);

-- 2 y 5. Registro e invitaciones -----------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inviter uuid;
  wanted text := lower(trim(coalesce(new.raw_user_meta_data->>'username', '')));
begin
  select id into inviter
  from public.profiles
  where friend_code = public.normalize_friend_code(new.raw_user_meta_data->>'invite_code')
    and not is_demo
  limit 1;

  if wanted !~ '^[a-z0-9._]{3,30}$' or exists (select 1 from public.profiles where lower(username) = wanted) then
    wanted := 'lector_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, invited_by)
  values (new.id, wanted, inviter);
  return new;
end;
$$;

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
    and not p.is_demo
  limit 1;
$$;

-- 3. Reinicio de la cuenta de visitante -------------------------------------------------------
create or replace function public.reset_demo_account()
returns void
language plpgsql
security definer set search_path = public, extensions
as $fn$
declare
  uid uuid;
  d date := current_date;
  y int := extract(year from current_date)::int;
  jan1 date := make_date(extract(year from current_date)::int, 1, 1);
  span int := greatest(current_date - make_date(extract(year from current_date)::int, 1, 1), 1);
  sherlock uuid;
  ana uuid;
begin
  select id into uid from profiles where is_demo limit 1;
  if uid is null then
    return;
  end if;

  -- Contraseña pública de siempre, por si alguien la cambió llamando a Supabase directamente.
  begin
    update auth.users set encrypted_password = crypt('teleo123', gen_salt('bf')) where id = uid;
  exception when others then
    raise warning 'reset_demo_account: no se pudo restablecer la contraseña (%).', sqlerrm;
  end;

  -- Borrar todo lo de la cuenta. Reseñas, citas, calificaciones, etiquetas y relecturas se van
  -- en cascada con los libros.
  delete from releases where user_id = uid;
  delete from period_favorites where user_id = uid;
  delete from reading_sessions where user_id = uid;
  delete from reading_goals where user_id = uid;
  delete from books where user_id = uid;
  delete from sagas where user_id = uid;

  -- Perfil. La espera de 7 días para cambiar el @ se limpia antes, para poder restablecerlo.
  update profiles set username_changed_at = null where id = uid;
  update profiles set
    username = 'visitante',
    nickname = 'Visitante',
    bio = 'Cuenta de prueba de Teleo, con una biblioteca de clásicos. Lo que cambies se borra cada noche.',
    avatar_url = null,
    banner = 'destellos',
    palette = 'atardecer',
    currency = 'CRC',
    priority_list_name = null,
    has_seen_intro = true,
    is_deactivated = false
  where id = uid;
  update profiles set username_changed_at = null where id = uid;

  -- Sagas.
  insert into sagas (user_id, title, author, status, total_books, is_favorite, estante_sort_order, created_at)
  values (uid, 'Sherlock Holmes', 'Arthur Conan Doyle', 'terminado', 3, true, 1000, (d - 300)::timestamptz)
  returning id into sherlock;
  insert into sagas (user_id, title, author, status, total_books, is_favorite, estante_sort_order, created_at)
  values (uid, 'Ana de las Tejas Verdes', 'L. M. Montgomery', 'leyendo', 8, false, 2000, (d - 200)::timestamptz)
  returning id into ana;

  -- Libros. frac = en qué parte del año (de enero a hoy) se terminó; así los 16 leídos siempre
  -- caen en el año en curso, con los últimos cerca de hoy. ago = hace cuántos días se empezó o
  -- se agregó.
  insert into books (
    user_id, title, author, status, saga_id, saga_sort_order, total_pages, current_page,
    start_date, end_date, genres, genres_source, moods, pace, format, language, isbn, cover_url,
    price, purchase_date, is_favorite, is_priority, priority_sort_order, paused_at, pause_reason,
    abandon_reason, estante_sort_order, created_at
  )
  select
    uid, v.title, v.author, v.status,
    case v.saga when 'sherlock' then sherlock when 'ana' then ana end,
    v.saga_order * 1000,
    v.pages,
    case when v.status = 'terminado' then v.pages else v.cur end,
    case
      when v.status = 'terminado' then (jan1 + floor(span * v.frac)::int) - greatest(4, v.pages / 30)
      when v.status in ('leyendo', 'pausado', 'abandonado') then d - v.ago
    end,
    case when v.status = 'terminado' then jan1 + floor(span * v.frac)::int end,
    v.genres, case when cardinality(v.genres) > 0 then 'manual' end,
    v.moods, v.pace, v.fmt, 'es', v.isbn,
    case when v.isbn is not null then 'https://covers.openlibrary.org/b/isbn/' || v.isbn || '-L.jpg' end,
    v.price,
    case when v.price is not null then d - v.ago - 20 end,
    v.fav,
    v.prio is not null, v.prio::double precision,
    case when v.status = 'pausado' then d - 21 end,
    case when v.status = 'pausado' then 'Lo dejo para las vacaciones, con calma.' end,
    case when v.status = 'abandonado' then 'Muy denso para este momento. Quizás lo retome algún día.' end,
    v.ord * 1000,
    (d - v.ago - 30)::timestamptz
  from (values
    -- ord, title, author, status, saga, saga_order, pages, frac, cur, ago, genres, moods, pace, fmt, isbn, price, fav, prio
    (1,  'Orgullo y prejuicio', 'Jane Austen', 'terminado', null, null, 432, 0.06, null, 300, array['romance','classics'], array['romantic','funny'], 'medium', 'fisico', '9780141439518', 9500, true, null),
    (2,  'Persuasión', 'Jane Austen', 'terminado', null, null, 288, 0.13, null, 280, array['romance','classics'], array['romantic','reflective'], 'slow', 'digital', '9780141439686', null, false, null),
    (3,  'Jane Eyre', 'Charlotte Brontë', 'terminado', null, null, 624, 0.20, null, 260, array['romance','classics'], array['emotional','dark'], 'medium', 'fisico', '9780141441146', 11900, true, null),
    (4,  'Cumbres borrascosas', 'Emily Brontë', 'terminado', null, null, 416, 0.27, null, 240, array['romance','classics'], array['dark','tense'], 'medium', 'fisico', '9780141439556', 8900, false, null),
    (5,  'Mujercitas', 'Louisa May Alcott', 'terminado', null, null, 560, 0.33, null, 220, array['classics','young_adult'], array['hopeful','emotional'], 'slow', 'audiolibro', '9780140390698', null, false, null),
    (6,  'Estudio en escarlata', 'Arthur Conan Doyle', 'terminado', 'sherlock', 1, 160, 0.38, null, 200, array['mystery','classics'], array['mysterious','adventurous'], 'fast', 'digital', '9780140439083', null, false, null),
    (7,  'El signo de los cuatro', 'Arthur Conan Doyle', 'terminado', 'sherlock', 2, 144, 0.43, null, 190, array['mystery','classics'], array['mysterious','adventurous'], 'fast', 'digital', '9780140439076', null, false, null),
    (8,  'El sabueso de los Baskerville', 'Arthur Conan Doyle', 'terminado', 'sherlock', 3, 208, 0.49, null, 180, array['mystery','classics'], array['mysterious','tense'], 'fast', 'fisico', '9780140437867', 7900, true, null),
    (9,  'Frankenstein', 'Mary Shelley', 'terminado', null, null, 288, 0.55, null, 170, array['horror','scifi','classics'], array['dark','reflective'], 'medium', 'fisico', '9780141439471', 8500, true, null),
    (10, 'Drácula', 'Bram Stoker', 'terminado', null, null, 512, 0.61, null, 150, array['horror','classics'], array['dark','tense'], 'medium', 'fisico', '9780141439846', 9900, false, null),
    (11, 'La máquina del tiempo', 'H. G. Wells', 'terminado', null, null, 128, 0.66, null, 130, array['scifi','classics'], array['adventurous','reflective'], 'fast', 'digital', '9780141439976', null, false, null),
    (12, 'Alicia en el país de las maravillas', 'Lewis Carroll', 'terminado', null, null, 176, 0.72, null, 110, array['fantasy','classics'], array['funny','adventurous'], 'fast', 'fisico', '9780141439761', 6900, false, null),
    (13, 'El retrato de Dorian Gray', 'Oscar Wilde', 'terminado', null, null, 304, 0.79, null, 90, array['classics','horror'], array['dark','reflective'], 'medium', 'fisico', '9780141439570', 8900, false, null),
    (14, 'La señora Dalloway', 'Virginia Woolf', 'terminado', null, null, 224, 0.86, null, 70, array['classics','contemporary'], array['reflective','sad'], 'slow', 'digital', '9780156628709', null, false, null),
    (15, 'El gran Gatsby', 'F. Scott Fitzgerald', 'terminado', null, null, 192, 0.93, null, 50, array['classics'], array['sad','reflective'], 'fast', 'fisico', '9780743273565', 7500, false, null),
    (16, 'El asesinato de Roger Ackroyd', 'Agatha Christie', 'terminado', null, null, 320, 0.99, null, 30, array['mystery','classics'], array['mysterious','tense'], 'fast', 'fisico', '9780062073488', 8900, true, null),
    (17, 'Ana de las Tejas Verdes', 'L. M. Montgomery', 'leyendo', 'ana', 1, 384, null, 214, 12, array['classics','young_adult'], array['hopeful','funny'], 'medium', 'fisico', '9780141321592', 7900, false, null),
    (18, 'Crimen y castigo', 'Fiódor Dostoyevski', 'leyendo', null, null, 720, null, 160, 25, array['classics','mystery'], array['dark','tense'], 'slow', 'digital', '9780140449136', null, false, null),
    (19, 'Guerra y paz', 'León Tolstói', 'pausado', null, null, 1440, null, 380, 80, array['classics','historical'], array['reflective'], 'slow', 'fisico', '9780140447934', 15900, false, null),
    (20, 'Ana de Avonlea', 'L. M. Montgomery', 'pendiente', 'ana', 2, 336, null, null, 10, array['classics','young_adult'], array[]::text[], null, 'fisico', null, 7900, false, 1),
    (21, 'Veinte mil leguas de viaje submarino', 'Julio Verne', 'pendiente', null, null, 464, null, null, 40, array['scifi','classics'], array[]::text[], null, 'fisico', null, 8500, false, 2),
    (22, 'El maravilloso mago de Oz', 'L. Frank Baum', 'pendiente', null, null, 224, null, null, 60, array['fantasy','classics'], array[]::text[], null, 'digital', null, null, false, null),
    (23, 'La metamorfosis', 'Franz Kafka', 'pendiente', null, null, 128, null, null, 70, array['classics'], array[]::text[], null, 'fisico', '9780553213690', 5900, false, 3),
    (24, 'Emma', 'Jane Austen', 'pendiente', null, null, 512, null, null, 90, array['romance','classics'], array[]::text[], null, 'digital', '9780141439587', null, false, null),
    (25, 'Grandes esperanzas', 'Charles Dickens', 'pendiente', null, null, 544, null, null, 100, array['classics'], array[]::text[], null, 'fisico', '9780141439563', 9500, false, null),
    (26, 'Middlemarch', 'George Eliot', 'deseado', null, null, 880, null, null, 20, array['classics'], array[]::text[], null, null, '9780141439549', null, false, null),
    (27, 'Moby Dick', 'Herman Melville', 'deseado', null, null, 720, null, null, 35, array['classics'], array[]::text[], null, null, '9780142437247', null, false, null),
    (28, 'Ulises', 'James Joyce', 'abandonado', null, null, 816, null, 120, 140, array['classics'], array[]::text[], null, 'fisico', '9780679722762', 12900, false, null)
  ) as v(ord, title, author, status, saga, saga_order, pages, frac, cur, ago, genres, moods, pace, fmt, isbn, price, fav, prio);

  -- Lecturas completas (la meta y el resumen cuentan desde acá).
  insert into reading_history (user_id, book_id, start_date, end_date, created_at)
  select uid, id, start_date, end_date, end_date::timestamptz
  from books where user_id = uid and status = 'terminado';

  -- Meta del año.
  insert into reading_goals (user_id, year, goal) values (uid, y, 24);

  -- Racha: los últimos 12 días hasta ayer, y días sueltos antes.
  insert into reading_sessions (user_id, session_date)
  select uid, s::date from generate_series(d - 12, d - 1, interval '1 day') s
  union
  select uid, s::date from generate_series(greatest(jan1, d - 150), d - 15, interval '3 days') s;

  -- Favoritos del año y del mes.
  insert into period_favorites (user_id, year, month, book_id)
  select uid, y, null, id from books where user_id = uid and title = 'Jane Eyre';
  insert into period_favorites (user_id, year, month, book_id)
  select uid, y, extract(month from end_date)::int, id
  from books where user_id = uid and status = 'terminado'
  order by end_date desc limit 1;

  -- Reseñas y citas (citas: traducciones propias de textos de dominio público).
  insert into reviews (user_id, book_id, general_comments, general_rating, recommends, content_warnings, favorite_character_name, created_at)
  select uid, b.id, r.comments, r.rating, true, r.warnings, r.fav_character, (b.end_date + 1)::timestamptz
  from (values
    ('Orgullo y prejuicio', 'Ingeniosa de principio a fin. Elizabeth es de esos personajes que te acompañan mucho después de cerrar el libro, y los diálogos siguen siendo filosos doscientos años después.', 5, array[]::text[], 'Elizabeth Bennet'),
    ('Persuasión', 'Más tranquila y madura que otras novelas de Austen. Las segundas oportunidades nunca se sintieron tan bien escritas. La carta del final vale el libro entero.', 5, array[]::text[], 'Anne Elliot'),
    ('Jane Eyre', 'Me sorprendió lo moderna que se siente la voz de Jane. Tiene momentos oscuros, pero también una dignidad y una fuerza que inspiran.', 5, array['abuso','enfermedad_grave'], 'Jane Eyre'),
    ('Cumbres borrascosas', 'Nadie es simpático y aun así no pude dejar de leer. Es intensa, fría y salvaje como los páramos donde ocurre.', 4, array['violencia','muerte','abuso'], 'Catherine'),
    ('El sabueso de los Baskerville', 'El mejor Holmes que he leído: misterio, atmósfera y un final que se lee de un tirón.', 5, array['muerte'], 'Sherlock Holmes'),
    ('Frankenstein', 'No es la historia de monstruos que esperaba: es triste, filosófica y muy humana. La criatura tiene los mejores capítulos.', 5, array['muerte','violencia'], 'La criatura'),
    ('Alicia en el país de las maravillas', 'Absurda y encantadora. Se lee rápido y deja muchas frases para subrayar.', 4, array[]::text[], 'El Gato de Cheshire'),
    ('El gran Gatsby', 'Corto y precioso. Todo brilla y todo duele un poco. El final me dejó pensando varios días.', 4, array['muerte'], 'Nick Carraway')
  ) as r(title, comments, rating, warnings, fav_character)
  join books b on b.user_id = uid and b.title = r.title;

  insert into favorite_quotes (review_id, quote_text, page, sort_order, cuaderno_sort_order, created_at)
  select rv.id, q.quote, q.page, q.ord, -extract(epoch from (d - q.ago)::timestamptz), (d - q.ago)::timestamptz
  from (values
    ('Orgullo y prejuicio', 'Es una verdad universalmente reconocida que un hombre soltero, dueño de una buena fortuna, necesita una esposa.', 1, 1, 290),
    ('Orgullo y prejuicio', 'Podría perdonar fácilmente su orgullo, si él no hubiera herido el mío.', 21, 2, 285),
    ('Persuasión', 'Me atraviesas el alma. Soy mitad angustia, mitad esperanza.', 241, 1, 270),
    ('Jane Eyre', 'No soy un pájaro, y ninguna red me atrapa: soy un ser humano libre, con voluntad propia.', 293, 1, 250),
    ('Cumbres borrascosas', 'Sean de lo que sean nuestras almas, la suya y la mía son iguales.', 81, 1, 230),
    ('El sabueso de los Baskerville', 'El mundo está lleno de cosas obvias que nadie, por casualidad, observa nunca.', 34, 1, 175),
    ('Frankenstein', 'Cuidado, porque no tengo miedo y, por eso, soy poderoso.', 214, 1, 160),
    ('Alicia en el país de las maravillas', 'Seguro que llegas a algún lado, si caminas lo suficiente.', 64, 1, 100),
    ('Alicia en el país de las maravillas', '¿De qué sirve un libro sin dibujos ni conversaciones?', 1, 2, 98),
    ('El gran Gatsby', 'Y así seguimos adelante, botes contra la corriente, arrastrados sin cesar hacia el pasado.', 180, 1, 40)
  ) as q(title, quote, page, ord, ago)
  join books b on b.user_id = uid and b.title = q.title
  join reviews rv on rv.book_id = b.id;
end;
$fn$;

revoke all on function public.reset_demo_account() from public;
revoke all on function public.reset_demo_account() from anon, authenticated;

-- Reinicio cada noche: 8:00 UTC = 2:00 en Costa Rica.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('teleo-reset-demo', '0 8 * * *', $$select public.reset_demo_account()$$);

-- Primera carga, si la cuenta ya existe.
select public.reset_demo_account();
