/** Banners anchos (V.4.2.0): versiones de los dibujos de banners.ts para el perfil en
 *  escritorio, donde el banner es mucho más ancho que alto y el dibujo de 360 × 140 dejaba
 *  medio banner vacío. Lienzo de 1080 × 230 (preserveAspectRatio slice). La franja izquierda
 *  (hasta ~380) queda tranquila porque ahí va tu nombre, y abajo a la derecha no va nada
 *  importante porque ahí cae tu foto. Mismos colores que los originales: todo con currentColor. */
import type { BannerId } from './banners'

function star(x: number, y: number, r: number, o: number): string {
  const k = r * 0.18;
  return '<path fill="currentColor" fill-opacity="' + o + '" d="M' + x + ' ' + (y - r) +
    ' C' + (x + k) + ' ' + (y - k) + ' ' + (x + k) + ' ' + (y - k) + ' ' + (x + r) + ' ' + y +
    ' C' + (x + k) + ' ' + (y + k) + ' ' + (x + k) + ' ' + (y + k) + ' ' + x + ' ' + (y + r) +
    ' C' + (x - k) + ' ' + (y + k) + ' ' + (x - k) + ' ' + (y + k) + ' ' + (x - r) + ' ' + y +
    ' C' + (x - k) + ' ' + (y - k) + ' ' + (x - k) + ' ' + (y - k) + ' ' + x + ' ' + (y - r) + 'Z"/>';
}
function svgW(inner: string): string {
  return '<svg viewBox="0 0 1080 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + '</svg>';
}
function seeded(s: number) { return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function dot(x: number, y: number, r: number, o: number) { return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="currentColor" fill-opacity="' + o.toFixed(2) + '"/>'; }

export const WIDE_BANNERS: Record<BannerId, () => string> = {
  destellos: function () {
    let o = '<defs><filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>' +
      '<linearGradient id="fugaz" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".6"/></linearGradient></defs>';
    o += '<circle cx="120" cy="10" r="110" fill="currentColor" fill-opacity=".10" filter="url(#bl)"/>';
    o += '<circle cx="600" cy="120" r="90" fill="currentColor" fill-opacity=".07" filter="url(#bl)"/>';
    o += '<circle cx="960" cy="230" r="130" fill="currentColor" fill-opacity=".12" filter="url(#bl)"/>';
    /* Órbitas grandes a la derecha y una pequeña al centro */
    o += '<ellipse cx="900" cy="190" rx="230" ry="70" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 6" transform="rotate(-12 900 190)"/>';
    o += '<ellipse cx="900" cy="190" rx="170" ry="46" fill="none" stroke="currentColor" stroke-opacity=".14" transform="rotate(-12 900 190)"/>';
    o += '<ellipse cx="560" cy="70" rx="90" ry="24" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-dasharray="2 5" transform="rotate(8 560 70)"/>';
    o += dot(690, 214, 5, .5) + dot(1068, 132, 4, .4) + dot(476, 58, 3.5, .45) + dot(648, 86, 2.5, .4);
    /* Dos estrellas fugaces */
    o += '<path d="M430 150 L 600 82" stroke="url(#fugaz)" stroke-width="2.6" stroke-linecap="round"/>' + star(603, 81, 8, .7);
    o += '<path d="M150 70 L 236 40" stroke="url(#fugaz)" stroke-width="1.8" stroke-linecap="round"/>' + star(238, 39, 5, .5);
    /* Destello grande con halo y cruz de luz, y otro mediano */
    o += '<circle cx="770" cy="92" r="24" fill="currentColor" fill-opacity=".08"/>' + star(770, 92, 20, .6) +
      '<line x1="770" y1="52" x2="770" y2="132" stroke="currentColor" stroke-opacity=".2"/><line x1="730" y1="92" x2="810" y2="92" stroke="currentColor" stroke-opacity=".2"/>';
    o += '<circle cx="1000" cy="50" r="14" fill="currentColor" fill-opacity=".08"/>' + star(1000, 50, 12, .5);
    /* Racimos de destellos */
    [[860, 44, 9, .45], [878, 62, 5, .35], [680, 34, 6, .4], [500, 190, 7, .4], [520, 176, 4, .3], [420, 40, 5, .35], [340, 120, 4, .25], [940, 120, 5, .35], [620, 200, 4, .3], [1050, 196, 4, .3], [260, 196, 3.5, .22], [60, 150, 3.5, .22]].forEach(function (d) { o += star(d[0], d[1], d[2], d[3]); });
    const r = seeded(11);
    for (let i = 0; i < 46; i++) {
      const x = r() * 1080, y = r() * 230, k = r();
      const left = x < 380 ? .55 : 1;
      o += dot(x, y, k < .7 ? 1.2 : 1.8, (.3 + k * .3) * left);
    }
    return svgW(o);
  },

  estanteria: function () {
    let o = '';
    /* Guirnalda de luces a todo lo ancho: tres tramos de Bézier cuadrática */
    function bez(p0: number[], c: number[], p1: number[], t: number): number[] { return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]; }
    const tramos = [[[-10, 18], [180, 64], [370, 22]], [[370, 22], [560, 70], [740, 20]], [[740, 20], [920, 66], [1090, 22]]];
    o += '<path d="' + tramos.map(function (tr, i) { return (i ? '' : 'M' + tr[0].join(' ')) + ' Q ' + tr[1].join(' ') + ' ' + tr[2].join(' '); }).join('') + '" fill="none" stroke="currentColor" stroke-opacity=".35"/>';
    tramos.forEach(function (tr, n) {
      [0.1, 0.26, 0.42, 0.58, 0.74, 0.9].forEach(function (t) {
        const pt = bez(tr[0], tr[1], tr[2], t), bx = +pt[0].toFixed(1), by = +pt[1].toFixed(1);
        const op = n === 0 ? .4 : .65;
        o += '<line x1="' + bx + '" y1="' + by + '" x2="' + bx + '" y2="' + (by + 4) + '" stroke="currentColor" stroke-opacity=".45"/>';
        o += '<circle cx="' + bx + '" cy="' + (by + 9) + '" r="8" fill="currentColor" fill-opacity=".12"/>';
        o += '<ellipse cx="' + bx + '" cy="' + (by + 9) + '" rx="2.8" ry="3.6" fill="currentColor" fill-opacity="' + op + '"/>';
      });
    });
    /* Estante largo con tres soportes */
    o += '<rect x="360" y="200" width="620" height="7" rx="3" fill="currentColor" fill-opacity=".38"/>';
    o += '<path d="M420 207 l 0 30 M920 207 l 0 30" stroke="currentColor" stroke-opacity=".3" stroke-width="3"/>';
    function libros(x0: number, list: number[][], tilt: number) {
      let x = x0;
      list.forEach(function (b, i) {
        const w = b[0], h = b[1], y = 200 - h;
        const rot = i === tilt ? ' transform="rotate(-10 ' + (x + w) + ' 200)"' : '';
        o += '<g' + rot + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="currentColor" fill-opacity="' + (0.16 + (i % 3) * 0.08) + '"/>' +
          '<rect x="' + x + '" y="' + (y + 7) + '" width="' + w + '" height="2" fill="currentColor" fill-opacity=".35"/>' +
          '<rect x="' + x + '" y="' + (y + h - 10) + '" width="' + w + '" height="2" fill="currentColor" fill-opacity=".35"/>' +
          '<rect x="' + (x + w / 2 - 1.5) + '" y="' + (y + 18) + '" width="3" height="' + (h * 0.35).toFixed(1) + '" rx="1.5" fill="currentColor" fill-opacity=".3"/></g>';
        x += w + (i === tilt - 1 ? 14 : 2);
      });
      return x;
    }
    /* Sujetalibros y primera fila de libros */
    o += '<path d="M410 200 v -40 a 12 12 0 0 1 12 -12 h 5 v 52 z" fill="currentColor" fill-opacity=".3"/>';
    libros(430, [[16, 76], [20, 90], [14, 68], [18, 84], [22, 96], [15, 74], [17, 86], [20, 92], [14, 66]], 7);
    /* Libros acostados con una taza humeante */
    o += '<rect x="626" y="186" width="56" height="14" rx="2" fill="currentColor" fill-opacity=".28"/><rect x="630" y="174" width="50" height="12" rx="2" fill="currentColor" fill-opacity=".2"/><rect x="634" y="164" width="44" height="10" rx="2" fill="currentColor" fill-opacity=".32"/>';
    o += '<path d="M644 140 h 22 v 15 a 8 8 0 0 1 -8 8 h -6 a 8 8 0 0 1 -8 -8 z" fill="currentColor" fill-opacity=".45"/><path d="M666 144 q 8 0 8 6 q 0 6 -8 6" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.8"/>';
    o += '<path d="M650 134 q -3 -6 0 -11 q 3 -5 0 -10 M659 134 q -3 -6 0 -11 q 3 -5 0 -10" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-linecap="round"/>';
    /* Segunda fila de libros */
    libros(700, [[18, 88], [15, 72], [21, 94], [16, 80], [19, 70]], -1);
    /* Globo terráqueo pequeño */
    o += '<circle cx="836" cy="156" r="24" fill="currentColor" fill-opacity=".22"/><ellipse cx="836" cy="156" rx="10" ry="24" fill="none" stroke="currentColor" stroke-opacity=".3"/><line x1="812" y1="156" x2="860" y2="156" stroke="currentColor" stroke-opacity=".3"/>';
    o += '<path d="M806 140 a 32 32 0 0 0 30 48" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="2"/><path d="M836 188 v 8 M824 200 h 24 l -4 -4 h -16 z" stroke="currentColor" stroke-opacity=".4" fill="currentColor" fill-opacity=".3"/>';
    /* Plantita colgante en maceta, al final */
    o += '<path d="M884 200 l -5 -22 h 30 l -5 22 z" fill="currentColor" fill-opacity=".42"/>';
    [[894, 178, -30], [899, 172, 10], [889, 168, -50], [904, 164, 30], [894, 160, -10]].forEach(function (l) { o += '<ellipse cx="' + l[0] + '" cy="' + (l[1] - 9) + '" rx="4.5" ry="10" fill="currentColor" fill-opacity=".32" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"/>'; });
    o += '<path d="M906 196 q 14 10 10 30 M880 198 q -8 14 -2 30" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="1.4"/>';
    [[916, 214], [912, 226], [878, 216]].forEach(function (l) { o += '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="3" ry="5" fill="currentColor" fill-opacity=".28"/>'; });
    /* Velita */
    o += '<rect x="384" y="178" width="12" height="22" rx="2" fill="currentColor" fill-opacity=".35"/><path d="M390 176 q -5 -8 0 -14 q 5 6 0 14 z" fill="currentColor" fill-opacity=".6"/><circle cx="390" cy="168" r="10" fill="currentColor" fill-opacity=".08"/>';
    /* Al lado izquierdo, solo un par de libros acostados y destellos */
    return svgW(o + star(300, 110, 5, .25) + star(960, 120, 6, .35) + star(520, 112, 4, .3) + star(990, 80, 4, .3) + star(180, 130, 3.5, .2));
  },

  luna: function () {
    let o = '<defs><filter id="lunaglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>';
    const mx = 860, my = 96, mr = 46;
    const r = seeded(7);
    for (let i = 0; i < 190; i++) {
      const x = r() * 1080, y = r() * 230, k = r();
      if (Math.hypot(x - mx, y - my) < 70) continue;
      const left = x < 380 ? .6 : 1;
      o += dot(x, y, k < 0.7 ? 0.8 : k < 0.92 ? 1.3 : 1.9, (0.25 + k * 0.45) * left);
    }
    /* Estrellas con destello */
    [[60, 40, 5, .3], [260, 30, 4, .28], [430, 44, 7, .5], [520, 120, 5, .4], [600, 36, 6, .45], [700, 150, 5, .4], [740, 40, 4, .35], [980, 40, 5, .4], [1040, 140, 6, .4], [960, 196, 4, .3], [470, 200, 4, .3], [180, 110, 3.5, .22]].forEach(function (d) { o += star(d[0], d[1], d[2], d[3]); });
    /* Osa Mayor */
    const osa = [[470, 86], [506, 74], [540, 80], [572, 96], [582, 128], [626, 132], [632, 100]];
    o += '<polyline points="' + osa.map(function (p) { return p.join(','); }).join(' ') + ' 572,96" fill="none" stroke="currentColor" stroke-opacity=".25"/>';
    osa.forEach(function (p, i) { o += dot(p[0], p[1], i % 2 ? 2.2 : 2.8, .7); });
    /* Luna llena con halo, anillos y cráteres */
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 24) + '" fill="currentColor" fill-opacity=".16" filter="url(#lunaglow)"/>';
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 14) + '" fill="none" stroke="currentColor" stroke-opacity=".15"/>';
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 30) + '" fill="none" stroke="currentColor" stroke-opacity=".08" stroke-dasharray="2 6"/>';
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + mr + '" fill="currentColor" fill-opacity=".5"/>';
    [[-15, -12, 9], [12, 9, 12], [18, -20, 6], [-18, 18, 6], [-3, 27, 4.5], [24, 22, 3.5]].forEach(function (c) { o += '<circle cx="' + (mx + c[0]) + '" cy="' + (my + c[1]) + '" r="' + c[2] + '" fill="currentColor" fill-opacity=".22"/>'; });
    /* Nubes finas cruzando */
    function nube(x: number, y: number, s: number, op: number) { return '<path transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0 0 q 10 -10 22 -4 q 8 -10 20 -2 q 12 -2 14 8 z" fill="currentColor" fill-opacity="' + op + '"/>'; }
    o += nube(740, 170, 2.2, .14) + nube(920, 150, 1.6, .12) + nube(560, 196, 1.8, .1) + nube(120, 70, 1.4, .08) + nube(380, 160, 1.2, .08);
    /* Estrella fugaz */
    o += '<path d="M640 20 L 720 50" stroke="currentColor" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>' + star(722, 51, 4.5, .55);
    return svgW(o);
  },
  cuaderno: function () {
    let o = '';
    /* Página grande con renglones que se sale por abajo, margen rojo y espiral */
    o += '<rect x="330" y="26" width="700" height="230" rx="8" fill="currentColor" fill-opacity=".12"/>';
    for (let y = 58; y < 240; y += 20) o += '<line x1="330" x2="1030" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-opacity=".2"/>';
    o += '<line x1="392" x2="392" y1="26" y2="240" stroke="currentColor" stroke-opacity=".4"/>';
    for (let x = 352; x < 1020; x += 26) o += '<ellipse cx="' + x + '" cy="26" rx="4.5" ry="10" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6"/>';
    /* Washi tape en la esquina derecha y otra a la izquierda */
    function washi(x: number, y: number, w: number, rot: number) {
      let g = '<g transform="rotate(' + rot + ' ' + (x + w / 2) + ' ' + (y + 9) + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="18" fill="currentColor" fill-opacity=".28"/>';
      for (let k = 6; k < w; k += 12) g += '<line x1="' + (x + k) + '" y1="' + y + '" x2="' + (x + k - 5) + '" y2="' + (y + 18) + '" stroke="currentColor" stroke-opacity=".25"/>';
      return g + '</g>';
    }
    o += washi(980, 42, 76, 32) + washi(310, 196, 64, -24);
    /* Lista con casillas */
    ([[416, 74, true], [416, 94, true], [416, 114, false], [416, 134, false]] as [number, number, boolean][]).forEach(function (c, i) {
      o += '<rect x="' + c[0] + '" y="' + (c[1] - 10) + '" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-opacity=".5"/>';
      if (c[2]) o += '<path d="M' + (c[0] + 2) + ' ' + (c[1] - 5) + ' l 3 3.5 l 6 -8" fill="none" stroke="currentColor" stroke-opacity=".65" stroke-width="1.6" stroke-linecap="round"/>';
      o += '<line x1="' + (c[0] + 20) + '" y1="' + (c[1] - 4) + '" x2="' + (c[0] + 90 + (i % 2) * 30) + '" y2="' + (c[1] - 4) + '" stroke="currentColor" stroke-opacity=".4" stroke-width="2.2" stroke-linecap="round"/>';
    });
    /* Corazón, estrella, flechita y la frase */
    o += '<path d="M612 98 c -10 -10 -24 0 -13 13 l 13 13 l 13 -13 c 11 -13 -3 -23 -13 -13 z" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.8"/>';
    o += star(676, 84, 12, .45) + star(700, 110, 6, .35);
    o += '<path d="M560 170 q 46 -22 92 -4" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M646 158 l 7 8 l -9 4" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6"/>';
    o += '<text x="666" y="178" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="20" fill="currentColor" fill-opacity=".5">leer más</text>';
    /* Sol con rayitos y una nota adhesiva */
    o += '<circle cx="780" cy="90" r="14" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6"/>';
    for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; o += '<line x1="' + (780 + Math.cos(t) * 20).toFixed(1) + '" y1="' + (90 + Math.sin(t) * 20).toFixed(1) + '" x2="' + (780 + Math.cos(t) * 27).toFixed(1) + '" y2="' + (90 + Math.sin(t) * 27).toFixed(1) + '" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>'; }
    o += '<g transform="rotate(6 880 120)"><rect x="840" y="80" width="84" height="80" rx="3" fill="currentColor" fill-opacity=".2"/><rect x="866" y="74" width="32" height="12" fill="currentColor" fill-opacity=".3"/>';
    for (let k = 0; k < 3; k++) o += '<line x1="852" x2="' + (910 - k * 10) + '" y1="' + (108 + k * 14) + '" y2="' + (108 + k * 14) + '" stroke="currentColor" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>';
    o += '</g>';
    /* Clip en el borde de la hoja */
    o += '<path d="M346 52 v -32 a 7 7 0 0 1 14 0 v 37 a 11 11 0 0 1 -22 0 v -27" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="2"/>';
    return svgW(o + star(220, 60, 5, .22) + star(120, 120, 4, .18) + star(1056, 140, 5, .3));
  },

  constelacion: function () {
    let o = '';
    /* Constelación grande con forma de libro abierto, al centro */
    const pts = [[540, 160], [590, 136], [636, 152], [682, 136], [732, 160], [732, 96], [682, 74], [636, 92], [590, 74], [540, 96]];
    o += '<polyline points="' + pts.concat([pts[0]]).map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width="1.3"/>';
    o += '<line x1="636" y1="92" x2="636" y2="152" stroke="currentColor" stroke-opacity=".32" stroke-width="1.3"/>';
    pts.forEach(function (p, i) { o += dot(p[0], p[1], i % 3 === 0 ? 4.2 : 3, .75) + dot(p[0], p[1], 9, .08); });
    /* Luna creciente */
    o += '<path d="M900 34 a 26 26 0 1 0 20 46 a 21 21 0 1 1 -20 -46 z" fill="currentColor" fill-opacity=".5"/>';
    o += '<circle cx="904" cy="62" r="40" fill="none" stroke="currentColor" stroke-opacity=".08"/>';
    /* Cometa */
    o += '<path d="M330 40 Q 380 58 430 52" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.8" stroke-linecap="round"/><path d="M336 48 Q 380 62 428 55" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-linecap="round"/>' + star(434, 52, 7, .6);
    /* Constelaciones secundarias: una a la derecha y otra tenue a la izquierda */
    const sec = [[800, 186], [836, 168], [870, 184], [906, 172], [930, 140]];
    o += '<polyline points="' + sec.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".25"/>';
    sec.forEach(function (p) { o += dot(p[0], p[1], 2.4, .6); });
    const izq = [[150, 40], [186, 30], [214, 50], [250, 44]];
    o += '<polyline points="' + izq.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".14"/>';
    izq.forEach(function (p) { o += dot(p[0], p[1], 1.8, .35); });
    /* Cielo salpicado */
    const r = seeded(23);
    for (let i = 0; i < 120; i++) {
      const x = r() * 1080, y = r() * 230, k = r();
      if (x > 520 && x < 752 && y > 60 && y < 176) continue;
      o += dot(x, y, k < .75 ? .9 : 1.5, (k < .6 ? .35 : .55) * (x < 380 ? .55 : 1));
    }
    return svgW(o + star(636, 40, 8, .5) + star(460, 180, 5, .35) + star(1000, 110, 6, .35) + star(780, 40, 5, .35) + star(260, 150, 4, .2));
  },

  exlibris: function () {
    let o = '';
    /* Marco doble a todo lo ancho, con esquinas decoradas */
    o += '<rect x="16" y="14" width="1048" height="202" rx="14" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="1.4"/>';
    o += '<rect x="26" y="24" width="1028" height="182" rx="8" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-dasharray="2 5"/>';
    [[16, 14, 1, 1], [1064, 14, -1, 1], [16, 216, 1, -1], [1064, 216, -1, -1]].forEach(function (c) {
      const x = c[0], y = c[1], sx = c[2], sy = c[3];
      o += '<path d="M' + x + ' ' + (y + sy * 34) + ' Q ' + (x + sx * 5) + ' ' + (y + sy * 5) + ' ' + (x + sx * 34) + ' ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.4"/>';
      o += dot(x + sx * 15, y + sy * 15, 3.5, .45);
      o += '<path d="M' + (x + sx * 26) + ' ' + (y + sy * 26) + ' l ' + (sx * 5) + ' ' + (sy * -5) + ' l ' + (sx * 5) + ' ' + (sy * 5) + ' l ' + (sx * -5) + ' ' + (sy * 5) + ' z" fill="currentColor" fill-opacity=".35"/>';
    });
    /* Emblema grande: libro abierto con laureles, al centro de la parte derecha */
    const cx = 690, cy = 112, s = 1.6;
    let e = '';
    e += '<path d="M-26 -12 Q -13 -18 0 -10 Q 13 -18 26 -12 L 26 12 Q 13 6 0 14 Q -13 6 -26 12 Z" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-opacity=".5"/>';
    e += '<line x1="0" y1="-10" x2="0" y2="14" stroke="currentColor" stroke-opacity=".5"/>';
    for (let k = 0; k < 3; k++) e += '<line x1="-21" y1="' + (-5 + k * 6) + '" x2="-5" y2="' + (-3 + k * 6) + '" stroke="currentColor" stroke-opacity=".35"/><line x1="5" y1="' + (-3 + k * 6) + '" x2="21" y2="' + (-5 + k * 6) + '" stroke="currentColor" stroke-opacity=".35"/>';
    [-1, 1].forEach(function (side) {
      e += '<path d="M' + (side * 34) + ' 20 Q ' + (side * 52) + ' 0 ' + (side * 40) + ' -22" fill="none" stroke="currentColor" stroke-opacity=".4"/>';
      for (let l = 0; l < 5; l++) {
        const t = l / 4, lx = side * (36 + 12 * Math.sin(t * Math.PI)), ly = 18 - t * 38;
        e += '<ellipse cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" rx="2.6" ry="5.5" fill="currentColor" fill-opacity=".38" transform="rotate(' + (side * (40 - t * 60)).toFixed(1) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')"/>';
      }
    });
    o += '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')">' + e + '</g>';
    o += star(cx, cy - 58, 9, .55) + '<circle cx="' + cx + '" cy="' + cy + '" r="98" fill="none" stroke="currentColor" stroke-opacity=".12"/>';
    /* Filetes con rombos a los lados del emblema */
    [[430, 570], [810, 950]].forEach(function (f) {
      o += '<line x1="' + f[0] + '" y1="' + cy + '" x2="' + f[1] + '" y2="' + cy + '" stroke="currentColor" stroke-opacity=".3"/>';
      const m = (f[0] + f[1]) / 2;
      o += '<path d="M' + m + ' ' + (cy - 6) + ' l 6 6 l -6 6 l -6 -6 z" fill="currentColor" fill-opacity=".4"/>' + dot(f[0], cy, 2.5, .4) + dot(f[1], cy, 2.5, .4);
    });
    o += star(500, 70, 5, .35) + star(880, 70, 5, .35) + star(500, 156, 4, .3) + star(880, 156, 4, .3);
    return svgW(o);
  },

  barco: function () {
    let o = '';
    /* Sol con halo */
    o += '<circle cx="890" cy="62" r="26" fill="currentColor" fill-opacity=".28"/><circle cx="890" cy="62" r="38" fill="none" stroke="currentColor" stroke-opacity=".15"/><circle cx="890" cy="62" r="52" fill="none" stroke="currentColor" stroke-opacity=".08"/>';
    /* Gaviotas */
    [[430, 50], [462, 66], [520, 38], [760, 40], [790, 56], [180, 50]].forEach(function (b, i) { o += '<path d="M' + (b[0] - 8) + ' ' + b[1] + ' q 4 -5 8 0 q 4 -5 8 0" fill="none" stroke="currentColor" stroke-opacity="' + (i === 5 ? .25 : .45) + '" stroke-width="1.5" stroke-linecap="round"/>'; });
    /* Nubes finas */
    o += '<path transform="translate(600 60) scale(2)" d="M0 0 q 10 -10 22 -4 q 8 -10 20 -2 q 12 -2 14 8 z" fill="currentColor" fill-opacity=".12"/>';
    o += '<path transform="translate(980 110) scale(1.4)" d="M0 0 q 10 -10 22 -4 q 8 -10 20 -2 q 12 -2 14 8 z" fill="currentColor" fill-opacity=".1"/>';
    /* Barquito grande y otro pequeño a lo lejos */
    function barco(bx: number, by: number, s: number, op: number) {
      let b = '<g transform="translate(' + bx + ' ' + by + ') scale(' + s + ')" opacity="' + op + '">';
      b += '<path d="M-34 0 L 34 0 L 22 14 L -22 14 Z" fill="currentColor" fill-opacity=".5"/>';
      b += '<path d="M0 -38 L 24 0 L -24 0 Z" fill="currentColor" fill-opacity=".35"/><path d="M0 -38 L 0 0" stroke="currentColor" stroke-opacity=".5"/>';
      for (let k = 1; k < 4; k++) b += '<line x1="' + (-18 + k * 2) + '" y1="' + (-6 - k * 7) + '" x2="-3" y2="' + (-6 - k * 7) + '" stroke="currentColor" stroke-opacity=".3"/>';
      return b + '</g>';
    }
    o += barco(470, 160, .8, .6) + barco(680, 146, 1.6, 1);
    /* Olas en capas a todo lo ancho */
    [[158, .14, 7], [174, .2, 6], [192, .28, 5]].forEach(function (L) {
      let d = 'M-10 ' + L[0];
      for (let x = -10; x < 1100; x += 48) d += ' q 12 -' + L[2] + ' 24 0 t 24 0';
      o += '<path d="' + d + ' L 1100 240 L -10 240 Z" fill="currentColor" fill-opacity="' + L[1] + '"/>';
    });
    [[420, 176], [560, 186], [760, 170], [840, 182], [620, 200], [980, 176], [300, 190]].forEach(function (f) { o += dot(f[0], f[1], 2, .5); });
    return svgW(o + star(760, 96, 6, .35) + star(330, 100, 4, .2) + star(1040, 40, 5, .3));
  },

  jardin: function () {
    let out = '';
    function daisy(x: number, y: number, r: number, petals: number, o: number): string {
      let g = '';
      for (let a = 0; a < petals; a++) g += '<ellipse cx="' + x + '" cy="' + (y - r * 0.62) + '" rx="' + (r * 0.34) + '" ry="' + (r * 0.5) + '" fill="currentColor" fill-opacity="' + o + '" transform="rotate(' + (a * 360 / petals) + ' ' + x + ' ' + y + ')"/>';
      return g + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.3) + '" fill="currentColor" fill-opacity="' + Math.min(o + 0.35, 0.85) + '"/>';
    }
    function stem(x: number, y: number, h: number) { return '<path d="M' + x + ' ' + y + ' Q ' + (x + 3) + ' ' + (y + h / 2) + ' ' + x + ' ' + (y + h) + '" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>'; }
    function tulip(x: number, y: number, s: number, o: number): string {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 30 Q 1 15 0 6" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M0 24 q -9 -4 -10 -14 q 8 3 10 12 z" fill="currentColor" fill-opacity=".28"/>' +
        '<path d="M-7 0 q 0 -10 3 -12 l 4 5 l 4 -5 q 3 2 3 12 q 0 8 -7 8 q -7 0 -7 -8 z" fill="currentColor" fill-opacity="' + o + '"/></g>';
    }
    function heart(x: number, y: number, r: number, o: number): string {
      return '<path d="M' + x + ' ' + (y + r) + ' C ' + (x - r * 1.6) + ' ' + (y - r * 0.2) + ', ' + (x - r * 0.6) + ' ' + (y - r * 1.4) + ', ' + x + ' ' + (y - r * 0.4) + ' C ' + (x + r * 0.6) + ' ' + (y - r * 1.4) + ', ' + (x + r * 1.6) + ' ' + (y - r * 0.2) + ', ' + x + ' ' + (y + r) + ' Z" fill="currentColor" fill-opacity="' + o + '"/>';
    }
    function petal(x: number, y: number, rot: number, o: number): string { return '<ellipse cx="' + x + '" cy="' + y + '" rx="3" ry="5.4" fill="currentColor" fill-opacity="' + o + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>'; }
    /* Macizo de flores abajo, a todo lo ancho */
    out += '<path d="M-10 230 C 80 214, 200 222, 330 210 S 520 192, 640 204 S 820 188, 940 200 S 1040 194, 1100 186 L 1100 240 L -10 240 Z" fill="currentColor" fill-opacity=".10"/>';
    for (let x = 380; x < 1080; x += 34) { const y = 206 - ((x * 7) % 12); out += '<ellipse cx="' + x + '" cy="' + (y - 8) + '" rx="4.5" ry="10" fill="currentColor" fill-opacity=".24" transform="rotate(' + ((x % 3) - 1) * 28 + ' ' + x + ' ' + y + ')"/>'; }
    /* Tulipanes y margaritas con tallos de distintas alturas */
    [[430, 150, 1.4, .5], [560, 138, 1.6, .45], [700, 152, 1.3, .42], [818, 132, 1.7, .5], [930, 156, 1.2, .4]].forEach(function (t) { out += tulip(t[0], t[1], t[2], t[3]); });
    [[480, 150, 18, 8, .45, 54], [628, 132, 22, 9, .5, 74], [756, 160, 15, 8, .42, 44], [880, 140, 19, 9, .48, 64], [1010, 152, 16, 8, .4, 54], [520, 186, 11, 7, .38, 20], [980, 190, 12, 7, .36, 16]].forEach(function (d) { out += stem(d[0], d[1] + d[2] * .3, d[5]) + daisy(d[0], d[1], d[2], d[3], d[4]); });
    /* Pétalos, florcitas y corazones que flotan arriba */
    out += daisy(600, 48, 10, 6, .35) + daisy(770, 34, 8, 6, .3) + daisy(960, 60, 9, 6, .32) + daisy(430, 40, 7, 6, .28) + daisy(250, 34, 6, 6, .2);
    [[520, 70, 30, .35], [680, 60, -40, .3], [860, 80, 60, .3], [1040, 40, -20, .28], [360, 90, 15, .22], [720, 100, 40, .25], [150, 80, -30, .16]].forEach(function (p) { out += petal(p[0], p[1], p[2], p[3]); });
    out += heart(560, 96, 6, .4) + heart(900, 34, 5, .35) + heart(1060, 110, 4.5, .3) + heart(300, 60, 4, .2) + heart(700, 26, 4, .3);
    /* Mariposa */
    out += '<g transform="translate(720 70) rotate(-12)" fill="currentColor"><ellipse cx="-7" cy="-4" rx="8" ry="6" fill-opacity=".4"/><ellipse cx="7" cy="-4" rx="8" ry="6" fill-opacity=".4"/><ellipse cx="-5" cy="6" rx="5" ry="4" fill-opacity=".32"/><ellipse cx="5" cy="6" rx="5" ry="4" fill-opacity=".32"/><rect x="-1" y="-8" width="2" height="18" rx="1" fill-opacity=".6"/></g>';
    [[640, 20], [820, 60], [1000, 24], [470, 92], [380, 30]].forEach(function (d) { out += dot(d[0], d[1], 1.8, .45); });
    return svgW(out);
  },

  citas: function () {
    let o = '';
    const cx = 690, by = 216, s = 1.7;
    /* Libro abierto grande, abajo al centro */
    let b = '<path d="M-86 -24 Q -44 -40 0 -26 Q 44 -40 86 -24 L 86 6 L -86 6 Z" fill="currentColor" fill-opacity=".3"/><path d="M0 -26 L 0 6" stroke="currentColor" stroke-opacity=".5"/>';
    for (let k = 0; k < 3; k++) { const y = -20 + k * 7; b += '<path d="M-74 ' + (y + 2) + ' Q -40 ' + (y - 8) + ' -8 ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".35"/><path d="M8 ' + y + ' Q 40 ' + (y - 8) + ' 74 ' + (y + 2) + '" fill="none" stroke="currentColor" stroke-opacity=".35"/>'; }
    b += '<path d="M30 -34 l 0 30 l 5 -6 l 5 6 l 0 -32" fill="currentColor" fill-opacity=".45"/>';
    o += '<g transform="translate(' + cx + ' ' + by + ') scale(' + s + ')">' + b + '</g>';
    /* Dos estelas que salen del libro hacia los lados */
    o += '<path d="M' + cx + ' 168 C 620 110, 520 120, 440 50" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 6"/>';
    o += '<path d="M' + cx + ' 168 C 760 100, 880 120, 940 40" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 6"/>';
    const glyphs: [string, number, number, number, number][] = [['“', 560, 120, 46, .4], ['”', 830, 96, 40, .35], ['a', 620, 100, 24, .45], ['T', 760, 70, 22, .4], ['e', 500, 70, 18, .35], ['s', 880, 60, 20, .35], ['“', 980, 120, 30, .25], ['”', 410, 150, 30, .22], ['L', 690, 60, 20, .4], ['o', 470, 110, 16, .3], ['r', 920, 140, 16, .3], ['i', 720, 34, 16, .35], ['”', 1040, 60, 24, .22], ['“', 300, 60, 24, .14]];
    glyphs.forEach(function (g) { o += '<text x="' + g[1] + '" y="' + g[2] + '" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="' + g[3] + '" font-weight="600" fill="currentColor" fill-opacity="' + g[4] + '">' + g[0] + '</text>'; });
    return svgW(o + star(690, 22, 8, .5) + star(540, 180, 5, .3) + star(860, 180, 6, .35) + star(1010, 90, 5, .3) + star(420, 90, 4, .25) + star(200, 120, 4, .16));
  },

  lluvia: function () {
    let o = '';
    function cloud(x: number, y: number, sc: number, op: number): string {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" fill="currentColor" opacity="' + op + '"><circle cx="0" cy="4" r="12"/><circle cx="18" cy="-4" r="17"/><circle cx="36" cy="4" r="12"/><rect x="0" y="4" width="36" height="12" rx="6"/></g>';
    }
    function drop(x: number, y: number, sz: number, op: number): string {
      return '<path d="M' + x + ' ' + (y - sz) + ' C ' + (x + sz * 0.8) + ' ' + (y - sz * 0.1) + ', ' + (x + sz * 0.7) + ' ' + (y + sz * 0.8) + ', ' + x + ' ' + (y + sz * 0.8) + ' C ' + (x - sz * 0.7) + ' ' + (y + sz * 0.8) + ', ' + (x - sz * 0.8) + ' ' + (y - sz * 0.1) + ', ' + x + ' ' + (y - sz) + ' Z" fill="currentColor" fill-opacity="' + op + '"/>';
    }
    o += cloud(160, 40, 1.1, .12) + cloud(400, 44, 1.5, .22) + cloud(560, 34, 1.2, .2) + cloud(700, 48, 1.6, .2) + cloud(960, 40, 1.1, .16);
    /* Gotas y líneas de lluvia */
    const r = seeded(5);
    for (let i = 0; i < 46; i++) {
      const x = 340 + r() * 640, y = 70 + r() * 130;
      if (x > 750 && x < 890 && y > 50) continue;
      if (i % 2) o += drop(+x.toFixed(1), +y.toFixed(1), 3 + r() * 2, i % 4 === 1 ? .5 : .35);
      else o += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (x - 3).toFixed(1) + '" y2="' + (y + 10).toFixed(1) + '" stroke="currentColor" stroke-opacity=".25" stroke-linecap="round"/>';
    }
    for (let i = 0; i < 10; i++) { const x = 40 + r() * 280, y = 70 + r() * 110; o += drop(+x.toFixed(1), +y.toFixed(1), 2.6, .16); }
    /* Paraguas grande sobre una pila de libros con una taza */
    const ux = 820, uy = 96, k = 1.5;
    o += '<g transform="translate(' + ux + ' ' + uy + ') scale(' + k + ')">';
    o += '<path d="M-48 0 Q 0 -50 48 0 q -12 -8 -24 0 q -12 -8 -24 0 q -12 -8 -24 0 q -12 -8 -24 0 z" fill="currentColor" fill-opacity=".45"/>';
    o += '<path d="M0 -25 Q -8 -10 -24 0 M0 -25 Q 8 -10 24 0 M0 -25 L 0 0" fill="none" stroke="currentColor" stroke-opacity=".3"/><line x1="0" y1="-25" x2="0" y2="-31" stroke="currentColor" stroke-opacity=".5" stroke-width="2"/>';
    o += '<path d="M0 0 L 0 52 q 0 8 -8 8 q -6 0 -6 -6" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></g>';
    o += '<rect x="764" y="196" width="66" height="14" rx="2" fill="currentColor" fill-opacity=".38"/><rect x="768" y="182" width="58" height="14" rx="2" fill="currentColor" fill-opacity=".26"/><rect x="772" y="168" width="52" height="14" rx="2" fill="currentColor" fill-opacity=".34"/>';
    o += '<path d="M838 188 h 18 v 12 a 6 6 0 0 1 -6 6 h -6 a 6 6 0 0 1 -6 -6 z" fill="currentColor" fill-opacity=".45"/><path d="M856 191 q 6 0 6 4 q 0 4 -6 4" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5"/><path d="M843 183 q -2 -5 0 -9 M850 183 q -2 -5 0 -9" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-linecap="round"/>';
    /* Charcos con ondas, y un barquito de papel en uno */
    [[560, 214, 30], [680, 220, 20], [440, 218, 16]].forEach(function (c) { o += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="4.5" fill="none" stroke="currentColor" stroke-opacity=".32"/><ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + (c[2] / 2) + '" ry="2.2" fill="none" stroke="currentColor" stroke-opacity=".25"/>'; });
    o += '<g transform="translate(560 210) scale(.5)"><path d="M-34 0 L 34 0 L 22 14 L -22 14 Z" fill="currentColor" fill-opacity=".5"/><path d="M0 -38 L 24 0 L -24 0 Z" fill="currentColor" fill-opacity=".35"/></g>';
    return svgW(o);
  },
};
