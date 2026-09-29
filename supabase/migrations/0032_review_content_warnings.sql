-- Avisos de contenido en la reseña (V.2.1.1). Se eligen de una lista fija (se guardan las
-- claves de src/lib/contentWarnings.ts) y se puede agregar un aviso escrito a mano.

alter table reviews
  add column content_warnings text[] not null default '{}',
  add column content_warnings_note text;
