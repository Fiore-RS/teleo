-- Fase 2 del retiro de la página pública de perfil (/@usuario): la app ya no expone
-- ningún dato de un usuario a otro. En su lugar, "Compartir perfil" genera una imagen
-- desde el propio dispositivo del usuario (ver ShareProfileModal.tsx) — no hay ninguna
-- ruta ni endpoint que un visitante sin cuenta pueda visitar para ver el perfil de otra
-- persona. Esta migración retira toda la infraestructura de RLS/RPC que existía
-- exclusivamente para esa página: las políticas "dueño gestiona..." de cada tabla ya
-- cubren todo lo que la propia app necesita (el usuario viendo sus propios datos), así
-- que quitar las políticas de "visitante" no le quita acceso a nadie a su propia
-- información.
--
-- Nota: las columnas show_* de `profiles` (show_annual_goal, show_daily_streak,
-- show_stats, show_years_in_books, show_currently_reading, show_favorites,
-- show_recommended, show_wishlist) NO se borran acá — quedan en la tabla sin uso, por si
-- se prefiere limpiarlas en una migración aparte más adelante. Lo único que se retira es
-- lo que dependía de ellas para exponer datos a terceros.

-- ---------------- PROFILES ----------------
-- "perfil publico visible para todos" (select using (true)) permitía que CUALQUIERA
-- leyera la fila de perfil de cualquier usuario — esa era la puerta de entrada de
-- /@usuario. Se reemplaza por una política que solo deja ver el propio perfil (no existía
-- una política de owner-select explícita hasta ahora porque la pública ya cubría ese
-- caso de paso).
drop policy "perfil publico visible para todos" on profiles;

create policy "dueño ve su propio perfil"
  on profiles for select
  using (auth.uid() = id);

-- ---------------- BOOKS ----------------
-- "dueño gestiona sus libros" (auth.uid() = user_id) ya cubre que el dueño vea sus
-- propios libros — esta política solo abría lectura a visitantes externos.
drop policy "visitante ve libros segun toggles del perfil" on books;

-- ---------------- BOOK_TAGS ----------------
drop policy "visitante ve tags de libros visibles" on book_tags;

-- ---------------- REVIEWS ----------------
drop policy "visitante ve reseñas de libros publicos" on reviews;

-- ---------------- CUSTOM_RATINGS ----------------
drop policy "visible si la reseña padre es visible" on custom_ratings;

-- ---------------- FAVORITE_QUOTES ----------------
drop policy "visible si la reseña padre es visible" on favorite_quotes;

-- ---------------- READING_GOALS ----------------
drop policy "visitante ve metas de lectura segun toggle del perfil" on reading_goals;

-- ---------------- READING_HISTORY ----------------
drop policy "visitante ve historial de lecturas segun toggle del perfil" on reading_history;

-- ---------------- RPC ----------------
-- Función que armaba el JSON de estadísticas para /@usuario (0008, redefinida en 0014,
-- 0015 y 0016) — ya no la llama nada en el código.
drop function if exists public.get_public_profile_extras(uuid);
