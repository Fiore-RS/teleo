-- Temas de color y banners (V.2.1.0). Se guardan en el perfil para que la cuenta se vea igual
-- en cualquier dispositivo. La app también guarda el tema en el navegador para aplicarlo
-- antes de que cargue el perfil (sin parpadeo del tema por defecto).
--
-- Los valores permitidos coinciden con src/lib/palettes.ts y src/lib/banners.ts.

alter table profiles
  add column palette text not null default 'atardecer'
    constraint profiles_palette_valid check (palette in (
      'atardecer', 'oceano', 'bosque', 'tinta', 'aurora',
      'dracula', 'biblioteca', 'algodon', 'lavanda', 'girasol'
    )),
  add column banner text not null default 'destellos'
    constraint profiles_banner_valid check (banner in (
      'destellos', 'estanteria', 'cuaderno', 'constelacion', 'exlibris',
      'barco', 'jardin', 'citas', 'luna', 'lluvia'
    ));
