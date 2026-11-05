-- Temas nuevos Arrecife y Ciruela (V.3.6.0).
--
-- Los valores permitidos coinciden con src/lib/palettes.ts. Los banners no cambian: cualquier
-- banner se puede usar con cualquier tema.

alter table profiles drop constraint profiles_palette_valid;

alter table profiles
  add constraint profiles_palette_valid check (palette in (
    'atardecer', 'bosque', 'aurora', 'biblioteca', 'algodon', 'margarita', 'arrecife', 'ciruela'
  ));
