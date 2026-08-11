-- =========================================================
-- TELEO — Esquema completo + RLS (versión corregida)
-- =========================================================
-- Orden: 1) todas las tablas  2) todas las políticas RLS
-- Esto evita el problema de referencias circulares entre
-- books <-> reviews.
-- =========================================================


-- =========================================================
-- PARTE 1 — TABLAS
-- =========================================================

-- ---------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  bio text check (char_length(bio) <= 150),
  avatar_url text,
  annual_goal int default 0,
  show_annual_goal boolean default true,
  show_daily_streak boolean default true,
  show_stats boolean default true,
  show_years_in_books boolean default true,
  show_currently_reading boolean default true,
  show_favorites boolean default true,
  show_recommended boolean default true,
  show_wishlist boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 2. SAGAS
-- ---------------------------------------------------------
create table sagas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  author text,
  category text,
  status text check (status in ('leyendo','pendiente','terminado','abandonado')),
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 3. BOOKS
-- ---------------------------------------------------------
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  saga_id uuid references sagas on delete set null,
  title text not null,
  author text,
  cover_url text,
  format text check (format in ('fisico','digital','audiolibro')),
  language text,
  category text,
  status text check (status in ('leyendo','pendiente','terminado','abandonado','deseado')) not null,
  is_favorite boolean default false,
  isbn text,
  total_pages int,
  current_page int,
  total_duration_seconds int,
  current_duration_seconds int,
  start_date date,
  end_date date,
  abandon_reason text,
  created_at timestamptz default now()
);

create index idx_books_user_status on books(user_id, status);
create index idx_books_isbn on books(isbn);

-- ---------------------------------------------------------
-- 4. BOOK_TAGS
-- ---------------------------------------------------------
create table book_tags (
  book_id uuid references books on delete cascade,
  tag text not null,
  primary key (book_id, tag)
);

-- ---------------------------------------------------------
-- 5. REVIEWS
-- (una reseña por libro — coincide con la UI de Figma)
-- ---------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books on delete cascade not null unique,
  user_id uuid references auth.users on delete cascade not null,
  general_rating numeric(2,1) check (general_rating between 0 and 5),
  general_comments text,
  recommends boolean,
  favorite_character_name text,
  favorite_character_notes text,
  favorite_character_photo_url text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------
-- 6. CUSTOM_RATINGS
-- ---------------------------------------------------------
create table custom_ratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews on delete cascade not null,
  label text not null,
  icon text not null,
  value numeric(2,1) check (value between 0 and 5)
);

-- ---------------------------------------------------------
-- 7. FAVORITE_QUOTES
-- ---------------------------------------------------------
create table favorite_quotes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews on delete cascade not null,
  quote_text text not null,
  sort_order int default 0
);

-- ---------------------------------------------------------
-- 8. READING_SESSIONS (racha)
-- ---------------------------------------------------------
create table reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  session_date date not null,
  unique (user_id, session_date)
);


-- =========================================================
-- PARTE 2 — RLS: activar en todas las tablas
-- =========================================================
alter table profiles enable row level security;
alter table sagas enable row level security;
alter table books enable row level security;
alter table book_tags enable row level security;
alter table reviews enable row level security;
alter table custom_ratings enable row level security;
alter table favorite_quotes enable row level security;
alter table reading_sessions enable row level security;


-- =========================================================
-- PARTE 3 — POLÍTICAS
-- =========================================================

-- ---------------- PROFILES ----------------
create policy "perfil publico visible para todos"
  on profiles for select
  using (true);

create policy "dueño crea su perfil"
  on profiles for insert
  with check (auth.uid() = id);

create policy "dueño actualiza su perfil"
  on profiles for update
  using (auth.uid() = id);

-- ---------------- SAGAS ----------------
-- Sin policy pública: sagas no aparecen en el perfil público.
create policy "dueño gestiona sus sagas"
  on sagas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------- BOOKS ----------------
create policy "dueño gestiona sus libros"
  on books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
        or (
          p.show_recommended
          and exists (
            select 1 from reviews r
            where r.book_id = books.id and r.recommends = true
          )
        )
      )
    )
  );

-- ---------------- BOOK_TAGS ----------------
create policy "dueño gestiona tags de sus libros"
  on book_tags for all
  using (
    exists (select 1 from books b where b.id = book_tags.book_id and b.user_id = auth.uid())
  )
  with check (
    exists (select 1 from books b where b.id = book_tags.book_id and b.user_id = auth.uid())
  );

create policy "visitante ve tags de libros visibles"
  on book_tags for select
  using (
    exists (select 1 from books b where b.id = book_tags.book_id)
  );

-- ---------------- REVIEWS ----------------
create policy "dueño gestiona sus reseñas"
  on reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "visitante ve reseñas de libros publicos"
  on reviews for select
  using (
    exists (
      select 1 from books b
      join profiles p on p.id = b.user_id
      where b.id = reviews.book_id
      and (
        (b.is_favorite and p.show_favorites)
        or (reviews.recommends = true and p.show_recommended)
      )
    )
  );

-- ---------------- CUSTOM_RATINGS ----------------
create policy "dueño gestiona calificaciones personalizadas"
  on custom_ratings for all
  using (
    exists (select 1 from reviews r where r.id = custom_ratings.review_id and r.user_id = auth.uid())
  )
  with check (
    exists (select 1 from reviews r where r.id = custom_ratings.review_id and r.user_id = auth.uid())
  );

create policy "visible si la reseña padre es visible"
  on custom_ratings for select
  using (
    exists (select 1 from reviews r where r.id = custom_ratings.review_id)
  );

-- ---------------- FAVORITE_QUOTES ----------------
create policy "dueño gestiona citas favoritas"
  on favorite_quotes for all
  using (
    exists (select 1 from reviews r where r.id = favorite_quotes.review_id and r.user_id = auth.uid())
  )
  with check (
    exists (select 1 from reviews r where r.id = favorite_quotes.review_id and r.user_id = auth.uid())
  );

create policy "visible si la reseña padre es visible"
  on favorite_quotes for select
  using (
    exists (select 1 from reviews r where r.id = favorite_quotes.review_id)
  );

-- ---------------- READING_SESSIONS ----------------
-- Sin policy pública: la racha se expone solo como número
-- derivado (vía función/vista), nunca como filas crudas.
create policy "dueño gestiona sus sesiones de lectura"
  on reading_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
