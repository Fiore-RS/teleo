-- Lanzamientos (fase 7): libros que salen a la venta y que la usuaria está esperando.
--
-- - place: texto libre (una librería, "Amazon", "preventa en la web de la editorial"...).
-- - price: opcional, en la moneda de la cuenta, igual que books.price.
-- - book_id: enlace opcional a un libro de su lista de deseados. Si ese libro se borra, el
--   lanzamiento se conserva y solo pierde el enlace.

create table releases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  author text,
  release_date date not null,
  place text,
  price numeric(10, 2),
  book_id uuid references books on delete set null,
  created_at timestamptz default now()
);

create index releases_user_date_idx on releases (user_id, release_date);
create index releases_book_id_idx on releases (book_id);

alter table releases enable row level security;

create policy "dueña gestiona sus lanzamientos"
  on releases for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
