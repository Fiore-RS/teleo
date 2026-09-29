-- Libros de regalo (V.2.1.0). Un libro se puede marcar como regalo y, si se quiere, anotar de
-- quién fue: un nombre, "Santa secreto", "mi club de lectura"... Es texto libre y opcional.
--
-- Un regalo cuenta como ₡0 en Compras: al marcarlo, la app guarda price = 0, así no suma al
-- total invertido sin tener que cambiar ninguna suma existente. Compras los separa de los
-- "Gratis" (precio 0 sin ser regalo) con su propio filtro, usando is_gift.
alter table books add column is_gift boolean not null default false;
alter table books add column gift_from text
  constraint books_gift_from_length check (gift_from is null or char_length(gift_from) between 1 and 60);
