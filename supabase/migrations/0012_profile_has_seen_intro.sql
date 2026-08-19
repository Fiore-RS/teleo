-- Marca si el usuario ya vio la pantalla de bienvenida / instrucciones,
-- para poder mostrarla una sola vez justo después de su primer inicio de sesión.
alter table profiles add column has_seen_intro boolean not null default false;
