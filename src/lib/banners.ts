/** Banners de Tu rincón (V.2.1.0). Cada banner es un dibujo SVG que se pinta con
 *  currentColor, así toma el color del tema activo: el contenedor pone el degradado del tema
 *  (de primary a rose) y el color de texto primary-ink. Se usan en la cabecera del perfil, en
 *  la mini cabecera de Editar perfil, en el catálogo y en la tarjeta para compartir.
 *  Los ids también están en la restricción de la columna profiles.banner (0028).
 *  Diseñados en el prototipo "Teleo: temas y banners": las coordenadas son de un lienzo de
 *  360 × 140 que se recorta al tamaño de cada lugar (preserveAspectRatio slice). */

export type BannerId =
  | 'destellos'
  | 'estanteria'
  | 'cuaderno'
  | 'constelacion'
  | 'exlibris'
  | 'barco'
  | 'jardin'
  | 'citas'
  | 'luna'
  | 'lluvia'

interface BannerArt {
  id: BannerId
  name: string
  desc: string
  draw: () => string
}

export const DEFAULT_BANNER: BannerId = 'destellos'

function star(x: number, y: number, r: number, o: number): string {
  const k = r * 0.18;
  return '<path fill="currentColor" fill-opacity="' + o + '" d="M' + x + ' ' + (y - r) +
    ' C' + (x + k) + ' ' + (y - k) + ' ' + (x + k) + ' ' + (y - k) + ' ' + (x + r) + ' ' + y +
    ' C' + (x + k) + ' ' + (y + k) + ' ' + (x + k) + ' ' + (y + k) + ' ' + x + ' ' + (y + r) +
    ' C' + (x - k) + ' ' + (y + k) + ' ' + (x - k) + ' ' + (y + k) + ' ' + (x - r) + ' ' + y +
    ' C' + (x - k) + ' ' + (y - k) + ' ' + (x - k) + ' ' + (y - k) + ' ' + x + ' ' + (y - r) + 'Z"/>';
}
function svg(inner: string): string {
  return '<svg viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + '</svg>';
}

const BANNERS: BannerArt[] = [
  { id: "destellos", name: "Destellos", desc: "Luces, órbitas y una estrella fugaz.", draw: function () {
    let o = '<defs><filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>' +
      '<linearGradient id="fugaz" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".6"/></linearGradient></defs>';
    o += '<circle cx="36" cy="14" r="58" fill="currentColor" fill-opacity=".12" filter="url(#bl)"/>';
    o += '<circle cx="318" cy="140" r="70" fill="currentColor" fill-opacity=".12" filter="url(#bl)"/>';
    o += '<ellipse cx="300" cy="118" rx="96" ry="40" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 5" transform="rotate(-14 300 118)"/>';
    o += '<ellipse cx="300" cy="118" rx="70" ry="26" fill="none" stroke="currentColor" stroke-opacity=".14" transform="rotate(-14 300 118)"/>';
    o += '<circle cx="236" cy="128" r="4" fill="currentColor" fill-opacity=".5"/><circle cx="364" cy="96" r="3" fill="currentColor" fill-opacity=".4"/>';
    /* Estrella fugaz */
    o += '<path d="M70 70 L 150 36" stroke="url(#fugaz)" stroke-width="2.4" stroke-linecap="round"/>' + star(152, 35, 7, .7);
    /* Destello grande con halo y cruz de luz */
    o += '<circle cx="200" cy="64" r="16" fill="currentColor" fill-opacity=".08"/>' + star(200, 64, 14, .6) +
      '<line x1="200" y1="36" x2="200" y2="92" stroke="currentColor" stroke-opacity=".2"/><line x1="172" y1="64" x2="228" y2="64" stroke="currentColor" stroke-opacity=".2"/>';
    /* Racimos de destellos */
    [[250, 30, 7, .45], [262, 44, 4, .35], [100, 110, 6, .4], [116, 100, 3.5, .3], [40, 58, 5, .35], [330, 30, 5, .35], [170, 118, 4, .3]].forEach(function (d) { o += star(d[0], d[1], d[2], d[3]); });
    [[222, 24], [284, 62], [60, 96], [140, 80], [320, 54], [22, 118], [186, 104]].forEach(function (d, i) { o += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + (i % 2 ? 1.2 : 1.8) + '" fill="currentColor" fill-opacity=".5"/>'; });
    return svg(o);
  } },
  { id: "estanteria", name: "Estantería", desc: "Un estante con libros, una plantita, una taza y luces colgando.", draw: function () {
    let o = '';
    /* Guirnalda de luces */
    o += '<path d="M-10 14 Q 90 44 180 16 T 370 18" fill="none" stroke="currentColor" stroke-opacity=".35"/>';
    /* Los bombillos siguen la curva: dos tramos de Bézier cuadrática. */
    function bez(p0: number[], c: number[], p1: number[], t: number): number[] { return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]; }
    const tramos = [[[-10, 14], [90, 44], [180, 16]], [[180, 16], [270, -12], [370, 18]]];
    tramos.forEach(function (tr) {
      [0.12, 0.34, 0.56, 0.78].forEach(function (t) {
        const pt = bez(tr[0], tr[1], tr[2], t), bx = pt[0], by = pt[1];
        o += '<line x1="' + bx + '" y1="' + by + '" x2="' + bx + '" y2="' + (by + 4) + '" stroke="currentColor" stroke-opacity=".45"/>';
        o += '<circle cx="' + bx + '" cy="' + (by + 8) + '" r="7" fill="currentColor" fill-opacity=".12"/>';
        o += '<ellipse cx="' + bx + '" cy="' + (by + 8) + '" rx="2.6" ry="3.4" fill="currentColor" fill-opacity=".65"/>';
      });
    });
    /* Estante */
    o += '<rect x="-10" y="118" width="380" height="6" rx="2" fill="currentColor" fill-opacity=".38"/>';
    o += '<path d="M40 124 l 0 14 M320 124 l 0 14" stroke="currentColor" stroke-opacity=".3" stroke-width="3"/>';
    /* Libros con bandas y títulos */
    const books = [[70,14,60],[86,18,70],[106,12,52],[120,16,64],[138,20,74],[160,13,58],[190,15,66],[207,18,72],[227,12,50]];
    books.forEach(function (b, i) {
      const x = b[0], w = b[1], h = b[2], y = 118 - h;
      const rot = i === 6 ? ' transform="rotate(-10 ' + (x + w) + ' 118)"' : '';
      o += '<g' + rot + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="currentColor" fill-opacity="' + (0.16 + (i % 3) * 0.08) + '"/>' +
        '<rect x="' + x + '" y="' + (y + 6) + '" width="' + w + '" height="2" fill="currentColor" fill-opacity=".35"/>' +
        '<rect x="' + x + '" y="' + (y + h - 9) + '" width="' + w + '" height="2" fill="currentColor" fill-opacity=".35"/>' +
        '<rect x="' + (x + w / 2 - 1.5) + '" y="' + (y + 16) + '" width="3" height="' + (h * 0.35) + '" rx="1.5" fill="currentColor" fill-opacity=".3"/></g>';
    });
    /* Libros acostados con una taza encima */
    o += '<rect x="250" y="106" width="46" height="12" rx="2" fill="currentColor" fill-opacity=".28"/><rect x="254" y="96" width="40" height="10" rx="2" fill="currentColor" fill-opacity=".2"/>';
    o += '<path d="M262 80 h 18 v 12 a 6 6 0 0 1 -6 6 h -6 a 6 6 0 0 1 -6 -6 z" fill="currentColor" fill-opacity=".45"/><path d="M280 83 q 7 0 7 5 q 0 5 -7 5" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6"/>';
    o += '<path d="M267 76 q -3 -5 0 -9 q 3 -4 0 -8 M274 76 q -3 -5 0 -9 q 3 -4 0 -8" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-linecap="round"/>';
    /* Plantita en maceta */
    o += '<path d="M318 118 l -4 -18 h 24 l -4 18 z" fill="currentColor" fill-opacity=".42"/>';
    [[326, 100, -30], [330, 96, 10], [322, 92, -50], [334, 88, 30], [326, 84, -10]].forEach(function (l) { o += '<ellipse cx="' + l[0] + '" cy="' + (l[1] - 8) + '" rx="4" ry="9" fill="currentColor" fill-opacity=".32" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"/>'; });
    /* Sujetalibros */
    o += '<path d="M52 118 v -30 a 10 10 0 0 1 10 -10 h 4 v 40 z" fill="currentColor" fill-opacity=".3"/>';
    return svg(o + star(24, 70, 5, .35) + star(352, 60, 4, .3));
  } },
  { id: "cuaderno", name: "Cuaderno", desc: "Una página con espiral, washi tape y dibujitos al margen.", draw: function () {
    let o = '';
    /* Hoja con renglones */
    o += '<rect x="30" y="18" width="300" height="130" rx="6" fill="currentColor" fill-opacity=".12"/>';
    for (let y = 42; y < 140; y += 14) o += '<line x1="30" x2="330" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-opacity=".2"/>';
    o += '<line x1="72" x2="72" y1="18" y2="148" stroke="currentColor" stroke-opacity=".4"/>';
    /* Espiral arriba */
    for (let x = 50; x < 320; x += 22) o += '<ellipse cx="' + x + '" cy="18" rx="4" ry="8" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6"/>';
    /* Washi tape en las esquinas */
    o += '<rect x="286" y="30" width="54" height="14" fill="currentColor" fill-opacity=".28" transform="rotate(32 313 37)"/>';
    o += '<g transform="rotate(32 313 37)">' + [0,1,2,3,4].map(function (k) { return '<line x1="' + (290 + k * 11) + '" y1="30" x2="' + (286 + k * 11) + '" y2="44" stroke="currentColor" stroke-opacity=".25"/>'; }).join('') + '</g>';
    /* Lista con casillas */
    ([[88, 52, true], [88, 66, true], [88, 80, false]] as [number, number, boolean][]).forEach(function (c, i) {
      o += '<rect x="' + c[0] + '" y="' + (c[1] - 8) + '" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-opacity=".5"/>';
      if (c[2]) o += '<path d="M' + (c[0] + 2) + ' ' + (c[1] - 4) + ' l 2.5 3 l 5 -7" fill="none" stroke="currentColor" stroke-opacity=".65" stroke-width="1.5" stroke-linecap="round"/>';
      o += '<line x1="' + (c[0] + 16) + '" y1="' + (c[1] - 3) + '" x2="' + (c[0] + 60 + i * 14) + '" y2="' + (c[1] - 3) + '" stroke="currentColor" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>';
    });
    /* Dibujitos: corazón, estrella y flechita */
    o += '<path d="M216 72 c -8 -8 -18 0 -10 10 l 10 10 l 10 -10 c 8 -10 -2 -18 -10 -10 z" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.6"/>';
    o += star(262, 62, 9, .45) + '<path d="M150 110 q 30 -14 58 -2" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M204 102 l 5 6 l -7 3" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/>';
    o += '<text x="218" y="116" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="14" fill="currentColor" fill-opacity=".5">leer más</text>';
    /* Clip */
    o += '<path d="M44 40 v -26 a 6 6 0 0 1 12 0 v 30 a 9 9 0 0 1 -18 0 v -22" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.8"/>';
    return svg(o);
  } },
  { id: "constelacion", name: "Constelación", desc: "Estrellas que dibujan un libro abierto, con luna y cometa.", draw: function () {
    let o = '';
    /* Constelación con forma de libro abierto */
    const pts = [[130, 96], [158, 82], [184, 92], [210, 82], [238, 96], [238, 60], [210, 48], [184, 58], [158, 48], [130, 60]];
    const line = pts.concat([pts[0]]).map(function (p) { return p.join(','); }).join(' ');
    o += '<polyline points="' + line + '" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width="1.1"/>';
    o += '<line x1="184" y1="58" x2="184" y2="92" stroke="currentColor" stroke-opacity=".32" stroke-width="1.1"/>';
    pts.forEach(function (p, i) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 === 0 ? 3.2 : 2.2) + '" fill="currentColor" fill-opacity=".75"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="currentColor" fill-opacity=".08"/>'; });
    /* Luna creciente */
    o += '<path d="M318 26 a 16 16 0 1 0 12 28 a 13 13 0 1 1 -12 -28 z" fill="currentColor" fill-opacity=".5"/>';
    /* Cometa */
    o += '<path d="M40 30 Q 70 40 96 36" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/><path d="M44 36 Q 70 44 94 38" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-linecap="round"/>' + star(98, 36, 5, .6);
    /* Pequeña constelación secundaria */
    o += '<polyline points="276,112 300,100 322,112 344,104" fill="none" stroke="currentColor" stroke-opacity=".25"/>';
    [[276,112],[300,100],[322,112],[344,104]].forEach(function (p) { o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="currentColor" fill-opacity=".6"/>'; });
    /* Cielo salpicado */
    for (let i = 0; i < 34; i++) {
      const x = (i * 71) % 360, y = (i * 43) % 140;
      if (x > 120 && x < 250 && y > 40 && y < 104) continue;
      o += '<circle cx="' + x + '" cy="' + y + '" r="' + (i % 4 === 0 ? 1.5 : 0.9) + '" fill="currentColor" fill-opacity="' + (i % 3 ? .35 : .55) + '"/>';
    }
    return svg(o + star(184, 24, 6, .5) + star(60, 108, 5, .35) + star(250, 128, 4, .3));
  } },
  { id: "exlibris", name: "Ex libris", desc: "Un marco de sello antiguo, como en la primera página de un libro.", draw: function () {
    let o = '';
    /* Marco doble con esquinas decoradas */
    o += '<rect x="14" y="12" width="332" height="116" rx="10" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.4"/>';
    o += '<rect x="22" y="20" width="316" height="100" rx="6" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="2 4"/>';
    [[14, 12, 1, 1], [346, 12, -1, 1], [14, 128, 1, -1], [346, 128, -1, -1]].forEach(function (c) {
      const x = c[0], y = c[1], sx = c[2], sy = c[3];
      o += '<path d="M' + x + ' ' + (y + sy * 26) + ' Q ' + (x + sx * 4) + ' ' + (y + sy * 4) + ' ' + (x + sx * 26) + ' ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.4"/>';
      o += '<circle cx="' + (x + sx * 12) + '" cy="' + (y + sy * 12) + '" r="3" fill="currentColor" fill-opacity=".45"/>';
      o += '<path d="M' + (x + sx * 20) + ' ' + (y + sy * 20) + ' l ' + (sx * 4) + ' ' + (sy * -4) + ' l ' + (sx * 4) + ' ' + (sy * 4) + ' l ' + (sx * -4) + ' ' + (sy * 4) + ' z" fill="currentColor" fill-opacity=".35"/>';
    });
    /* Emblema: libro abierto con laureles */
    const cx = 180, cy = 70;
    o += '<path d="M' + (cx - 26) + ' ' + (cy - 12) + ' Q ' + (cx - 13) + ' ' + (cy - 18) + ' ' + cx + ' ' + (cy - 10) + ' Q ' + (cx + 13) + ' ' + (cy - 18) + ' ' + (cx + 26) + ' ' + (cy - 12) + ' L ' + (cx + 26) + ' ' + (cy + 12) + ' Q ' + (cx + 13) + ' ' + (cy + 6) + ' ' + cx + ' ' + (cy + 14) + ' Q ' + (cx - 13) + ' ' + (cy + 6) + ' ' + (cx - 26) + ' ' + (cy + 12) + ' Z" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-opacity=".5"/>';
    o += '<line x1="' + cx + '" y1="' + (cy - 10) + '" x2="' + cx + '" y2="' + (cy + 14) + '" stroke="currentColor" stroke-opacity=".5"/>';
    for (let k = 0; k < 3; k++) {
      o += '<line x1="' + (cx - 21) + '" y1="' + (cy - 5 + k * 6) + '" x2="' + (cx - 5) + '" y2="' + (cy - 3 + k * 6) + '" stroke="currentColor" stroke-opacity=".35"/>';
      o += '<line x1="' + (cx + 5) + '" y1="' + (cy - 3 + k * 6) + '" x2="' + (cx + 21) + '" y2="' + (cy - 5 + k * 6) + '" stroke="currentColor" stroke-opacity=".35"/>';
    }
    [-1, 1].forEach(function (side) {
      o += '<path d="M' + (cx + side * 34) + ' ' + (cy + 20) + ' Q ' + (cx + side * 52) + ' ' + cy + ' ' + (cx + side * 40) + ' ' + (cy - 22) + '" fill="none" stroke="currentColor" stroke-opacity=".4"/>';
      for (let l = 0; l < 5; l++) {
        const t = l / 4, lx = cx + side * (36 + 12 * Math.sin(t * Math.PI)), ly = cy + 18 - t * 38;
        o += '<ellipse cx="' + lx + '" cy="' + ly + '" rx="2.6" ry="5.5" fill="currentColor" fill-opacity=".38" transform="rotate(' + (side * (40 - t * 60)) + ' ' + lx + ' ' + ly + ')"/>';
      }
    });
    o += star(cx, cy - 32, 6, .55) + star(96, 70, 4, .35) + star(264, 70, 4, .35);
    o += '<line x1="60" y1="70" x2="88" y2="70" stroke="currentColor" stroke-opacity=".3"/><line x1="272" y1="70" x2="300" y2="70" stroke="currentColor" stroke-opacity=".3"/>';
    return svg(o);
  } },
  { id: "barco", name: "Barco de papel", desc: "Un barquito hecho de una página, sobre olas suaves.", draw: function () {
    let o = '';
    o += '<circle cx="300" cy="38" r="16" fill="currentColor" fill-opacity=".28"/><circle cx="300" cy="38" r="24" fill="none" stroke="currentColor" stroke-opacity=".15"/>';
    [[60, 32], [84, 44], [120, 26]].forEach(function (b) { o += '<path d="M' + (b[0] - 6) + ' ' + b[1] + ' q 3 -4 6 0 q 3 -4 6 0" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>'; });
    /* Barquito de papel: casco, vela y un pliegue con renglones de página */
    const bx = 170, by = 88;
    o += '<path d="M' + (bx - 34) + ' ' + by + ' L ' + (bx + 34) + ' ' + by + ' L ' + (bx + 22) + ' ' + (by + 14) + ' L ' + (bx - 22) + ' ' + (by + 14) + ' Z" fill="currentColor" fill-opacity=".5"/>';
    o += '<path d="M' + bx + ' ' + (by - 38) + ' L ' + (bx + 24) + ' ' + by + ' L ' + (bx - 24) + ' ' + by + ' Z" fill="currentColor" fill-opacity=".35"/>';
    o += '<path d="M' + bx + ' ' + (by - 38) + ' L ' + bx + ' ' + by + '" stroke="currentColor" stroke-opacity=".5"/>';
    for (let k = 1; k < 4; k++) o += '<line x1="' + (bx - 18 + k * 2) + '" y1="' + (by - 6 - k * 7) + '" x2="' + (bx - 3) + '" y2="' + (by - 6 - k * 7) + '" stroke="currentColor" stroke-opacity=".3"/>';
    /* Olas en capas */
    const layers = [[96, .16], [106, .22], [118, .3]];
    layers.forEach(function (L, n) {
      const y = L[0];
      let d = 'M-10 ' + y;
      for (let x = -10; x < 380; x += 40) d += ' q 10 -' + (7 - n) + ' 20 0 t 20 0';
      o += '<path d="' + d + ' L 380 150 L -10 150 Z" fill="currentColor" fill-opacity="' + L[1] + '"/>';
    });
    [[40, 104], [88, 112], [250, 100], [300, 110], [336, 104], [212, 116]].forEach(function (f) { o += '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="1.8" fill="currentColor" fill-opacity=".55"/>'; });
    return svg(o + star(240, 30, 5, .35) + star(30, 70, 4, .3));
  } },
  { id: "jardin", name: "Jardín", desc: "Margaritas, tulipanes y pétalos que flotan.", draw: function () {
    let out = '';
    /* Margarita: pétalos redondos alrededor de un centro. */
    function daisy(x: number, y: number, r: number, petals: number, o: number): string {
      let g = '';
      for (let a = 0; a < petals; a++) {
        g += '<ellipse cx="' + x + '" cy="' + (y - r * 0.62) + '" rx="' + (r * 0.34) + '" ry="' + (r * 0.5) + '" fill="currentColor" fill-opacity="' + o + '" transform="rotate(' + (a * 360 / petals) + ' ' + x + ' ' + y + ')"/>';
      }
      return g + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.3) + '" fill="currentColor" fill-opacity="' + Math.min(o + 0.35, 0.85) + '"/>';
    }
    /* Tulipán con tallo y hoja. */
    function tulip(x: number, y: number, h: number, o: number): string {
      return '<path d="M' + x + ' ' + (y + 30) + ' Q ' + (x + 1) + ' ' + (y + 30 - h / 2) + ' ' + x + ' ' + (y + 6) + '" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M' + x + ' ' + (y + 24) + ' q -9 -4 -10 -14 q 8 3 10 12 z" fill="currentColor" fill-opacity=".28"/>' +
        '<path d="M' + (x - 7) + ' ' + y + ' q 0 -10 3 -12 l 4 5 l 4 -5 q 3 2 3 12 q 0 8 -7 8 q -7 0 -7 -8 z" fill="currentColor" fill-opacity="' + o + '"/>';
    }
    function heart(x: number, y: number, r: number, o: number): string {
      return '<path d="M' + x + ' ' + (y + r) + ' C ' + (x - r * 1.6) + ' ' + (y - r * 0.2) + ', ' + (x - r * 0.6) + ' ' + (y - r * 1.4) + ', ' + x + ' ' + (y - r * 0.4) +
        ' C ' + (x + r * 0.6) + ' ' + (y - r * 1.4) + ', ' + (x + r * 1.6) + ' ' + (y - r * 0.2) + ', ' + x + ' ' + (y + r) + ' Z" fill="currentColor" fill-opacity="' + o + '"/>';
    }
    function petal(x: number, y: number, rot: number, o: number): string {
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="2.6" ry="4.6" fill="currentColor" fill-opacity="' + o + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>';
    }
    /* Macizo de flores abajo, con hojitas. */
    out += '<path d="M-10 140 C 40 118, 90 128, 140 120 S 250 110, 300 122 S 360 118, 380 112 L 380 150 L -10 150 Z" fill="currentColor" fill-opacity=".10"/>';
    [[22,120,-30],[58,116,25],[104,122,-20],[172,114,30],[214,120,-25],[262,112,20],[318,116,-30],[348,110,25]].forEach(function (l) {
      out += '<ellipse cx="' + l[0] + '" cy="' + (l[1] - 7) + '" rx="4" ry="9" fill="currentColor" fill-opacity=".26" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"/>';
    });
    out += tulip(80, 92, 22, .5) + tulip(236, 88, 24, .45) + tulip(300, 96, 20, .4);
    out += daisy(38, 102, 14, 8, .45) + daisy(142, 104, 11, 7, .4) + daisy(190, 96, 16, 9, .5) + daisy(334, 90, 12, 8, .45);
    /* Flores pequeñas y pétalos que flotan arriba. */
    out += daisy(120, 40, 8, 6, .35) + daisy(270, 30, 7, 6, .3) + daisy(56, 28, 6, 6, .3);
    out += petal(170, 30, 30, .35) + petal(212, 52, -40, .3) + petal(320, 44, 60, .3) + petal(92, 60, -20, .28) + petal(248, 64, 15, .25);
    out += heart(160, 58, 5, .4) + heart(300, 64, 4, .35) + heart(30, 58, 3.5, .3) + heart(222, 22, 3.5, .3);
    [[140, 18], [196, 34], [344, 20], [84, 16], [266, 50]].forEach(function (d) { out += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="1.6" fill="currentColor" fill-opacity=".45"/>'; });
    return svg(out);
  } },
  { id: "citas", name: "Citas", desc: "Un libro abierto del que salen letras y comillas.", draw: function () {
    let o = '';
    const cx = 180, by = 128;
    /* Libro abierto con páginas curvas y renglones */
    o += '<path d="M' + (cx - 86) + ' ' + (by - 24) + ' Q ' + (cx - 44) + ' ' + (by - 40) + ' ' + cx + ' ' + (by - 26) + ' Q ' + (cx + 44) + ' ' + (by - 40) + ' ' + (cx + 86) + ' ' + (by - 24) + ' L ' + (cx + 86) + ' ' + (by + 6) + ' L ' + (cx - 86) + ' ' + (by + 6) + ' Z" fill="currentColor" fill-opacity=".3"/>';
    o += '<path d="M' + cx + ' ' + (by - 26) + ' L ' + cx + ' ' + (by + 6) + '" stroke="currentColor" stroke-opacity=".5"/>';
    for (let k = 0; k < 3; k++) {
      const y = by - 20 + k * 7;
      o += '<path d="M' + (cx - 74) + ' ' + (y + 2) + ' Q ' + (cx - 40) + ' ' + (y - 8) + ' ' + (cx - 8) + ' ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".35"/>';
      o += '<path d="M' + (cx + 8) + ' ' + y + ' Q ' + (cx + 40) + ' ' + (y - 8) + ' ' + (cx + 74) + ' ' + (y + 2) + '" fill="none" stroke="currentColor" stroke-opacity=".35"/>';
    }
    /* Cinta separadora */
    o += '<path d="M' + (cx + 30) + ' ' + (by - 34) + ' l 0 30 l 5 -6 l 5 6 l 0 -32" fill="currentColor" fill-opacity=".45"/>';
    /* Estela mágica: letras y comillas que suben */
    o += '<path d="M' + cx + ' ' + (by - 30) + ' C 150 70, 210 60, 170 20" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 5"/>';
    const glyphs = [['“', 132, 70, 30, .4], ['”', 236, 52, 26, .35], ['a', 166, 50, 16, .45], ['T', 196, 36, 14, .4], ['e', 150, 30, 12, .35], ['s', 214, 84, 13, .35], ['“', 280, 30, 20, .25], ['”', 70, 44, 20, .25]];
    glyphs.forEach(function (g) {
      o += '<text x="' + g[1] + '" y="' + g[2] + '" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="' + g[3] + '" font-weight="600" fill="currentColor" fill-opacity="' + g[4] + '">' + g[0] + '</text>';
    });
    return svg(o + star(186, 18, 6, .5) + star(110, 96, 4, .3) + star(260, 96, 5, .35) + star(320, 60, 4, .3) + star(40, 90, 4, .3));
  } },
  { id: "luna", name: "Luna", desc: "Una luna llena con cráteres en un cielo estrellado.", draw: function () {
    let o = '<defs><filter id="lunaglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter></defs>';
    /* Cielo estrellado: puntos de varios tamaños repartidos con una semilla fija */
    let seed = 7;
    function rnd(): number { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 360, y = rnd() * 140, r = rnd();
      if (Math.hypot(x - 296, y - 70) < 46) continue;          /* deja libre la luna */
      o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r < 0.7 ? 0.8 : r < 0.92 ? 1.3 : 1.9) + '" fill="currentColor" fill-opacity="' + (0.25 + r * 0.45).toFixed(2) + '"/>';
    }
    /* Estrellas con destello */
    [[40, 30, 6, .45], [120, 20, 4, .35], [176, 52, 7, .5], [226, 24, 5, .4], [98, 70, 4, .3], [150, 104, 5, .35], [214, 112, 4, .3], [350, 128, 5, .35], [250, 60, 3.5, .3], [340, 18, 4, .35]].forEach(function (d) { o += star(d[0], d[1], d[2], d[3]); });
    /* Luna llena con halo y cráteres */
    const mx = 296, my = 70, mr = 30;
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 16) + '" fill="currentColor" fill-opacity=".16" filter="url(#lunaglow)"/>';
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 10) + '" fill="none" stroke="currentColor" stroke-opacity=".15"/>';
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + mr + '" fill="currentColor" fill-opacity=".5"/>';
    [[-10, -8, 6], [8, 6, 8], [12, -14, 4], [-12, 12, 4], [-2, 18, 3]].forEach(function (c) { o += '<circle cx="' + (mx + c[0]) + '" cy="' + (my + c[1]) + '" r="' + c[2] + '" fill="currentColor" fill-opacity=".22"/>'; });
    /* Nubes finas cruzando */
    o += '<path d="M226 118 q 10 -10 22 -4 q 8 -10 20 -2 q 12 -2 14 8 z" fill="currentColor" fill-opacity=".14"/>';
    o += '<path d="M60 42 q 8 -8 18 -3 q 7 -8 16 -2 q 10 -1 11 6 z" fill="currentColor" fill-opacity=".12"/>';
    return svg(o);
  } },
  { id: "lluvia", name: "Lluvia", desc: "Gotas, nubes y un paraguas que cuida tus libros.", draw: function () {
    let o = '';
    function cloud(x: number, y: number, sc: number, op: number): string {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" fill="currentColor" opacity="' + op + '">' +
        '<circle cx="0" cy="4" r="12"/><circle cx="18" cy="-4" r="17"/><circle cx="36" cy="4" r="12"/><rect x="0" y="4" width="36" height="12" rx="6"/></g>';
    }
    function drop(x: number, y: number, sz: number, op: number): string {
      return '<path d="M' + x + ' ' + (y - sz) + ' C ' + (x + sz * 0.8) + ' ' + (y - sz * 0.1) + ', ' + (x + sz * 0.7) + ' ' + (y + sz * 0.8) + ', ' + x + ' ' + (y + sz * 0.8) + ' C ' + (x - sz * 0.7) + ' ' + (y + sz * 0.8) + ', ' + (x - sz * 0.8) + ' ' + (y - sz * 0.1) + ', ' + x + ' ' + (y - sz) + ' Z" fill="currentColor" fill-opacity="' + op + '"/>';
    }
    o += cloud(40, 26, 1.1, .24) + cloud(150, 18, .9, .2) + cloud(230, 30, .7, .16);
    /* Gotas con forma de lágrima y algunas líneas finas */
    [[60, 62, 4], [90, 80, 3], [128, 56, 4], [170, 70, 3.5], [196, 50, 3], [150, 96, 3], [210, 94, 4], [110, 110, 3], [236, 64, 3], [40, 94, 3]].forEach(function (d, i) { o += drop(d[0], d[1], d[2], i % 2 ? .35 : .5); });
    for (let i = 0; i < 12; i++) { const x = 30 + (i * 37) % 230, y = 50 + (i * 29) % 60; o += '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 3) + '" y2="' + (y + 8) + '" stroke="currentColor" stroke-opacity=".25" stroke-linecap="round"/>'; }
    /* Paraguas abierto sobre una pila de libros con una taza */
    const ux = 300, uy = 58;
    o += '<path d="M' + (ux - 48) + ' ' + uy + ' Q ' + ux + ' ' + (uy - 50) + ' ' + (ux + 48) + ' ' + uy + ' q -12 -8 -24 0 q -12 -8 -24 0 q -12 -8 -24 0 q -12 -8 -24 0 z" fill="currentColor" fill-opacity=".45"/>';
    o += '<path d="M' + ux + ' ' + (uy - 25) + ' Q ' + (ux - 8) + ' ' + (uy - 10) + ' ' + (ux - 24) + ' ' + uy + ' M' + ux + ' ' + (uy - 25) + ' Q ' + (ux + 8) + ' ' + (uy - 10) + ' ' + (ux + 24) + ' ' + uy + ' M' + ux + ' ' + (uy - 25) + ' L ' + ux + ' ' + uy + '" fill="none" stroke="currentColor" stroke-opacity=".3"/>';
    o += '<line x1="' + ux + '" y1="' + (uy - 25) + '" x2="' + ux + '" y2="' + (uy - 31) + '" stroke="currentColor" stroke-opacity=".5" stroke-width="2"/>';
    o += '<path d="M' + ux + ' ' + uy + ' L ' + ux + ' ' + (uy + 52) + ' q 0 8 -8 8 q -6 0 -6 -6" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>';
    o += '<rect x="262" y="104" width="44" height="10" rx="2" fill="currentColor" fill-opacity=".32"/><rect x="266" y="94" width="38" height="10" rx="2" fill="currentColor" fill-opacity=".24"/><rect x="264" y="114" width="46" height="10" rx="2" fill="currentColor" fill-opacity=".38"/>';
    o += '<path d="M314 108 h 14 v 9 a 5 5 0 0 1 -5 5 h -4 a 5 5 0 0 1 -5 -5 z" fill="currentColor" fill-opacity=".45"/><path d="M318 104 q -2 -4 0 -7 M323 104 q -2 -4 0 -7" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-linecap="round"/>';
    /* Charcos con ondas */
    [[190, 128, 18], [240, 132, 12]].forEach(function (c) { o += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="3.5" fill="none" stroke="currentColor" stroke-opacity=".32"/><ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + (c[2] / 2) + '" ry="1.8" fill="none" stroke="currentColor" stroke-opacity=".25"/>'; });
    return svg(o);
  } },
];

export const banners = BANNERS.map(({ id, name, desc }) => ({ id, name, description: desc }))

export function isBannerId(value: unknown): value is BannerId {
  return typeof value === 'string' && BANNERS.some((b) => b.id === value)
}

/** SVG completo del banner. `uid` hace únicos los ids internos (filtros, degradados), porque
 *  en el catálogo se dibujan varios banners a la vez en la misma página. */
export function bannerSvg(id: BannerId, uid: string): string {
  const art = BANNERS.find((b) => b.id === id) ?? BANNERS[0]
  return art
    .draw()
    .replace(/id="([^"]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`)
}
