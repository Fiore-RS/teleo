/** Decoraciones de la tarjeta para compartir una cita (Mis citas, V.2.1.0). Cada banner de
 *  Tu rincón tiene su versión de tarjeta completa (360 × 640): la misma temática, pero pensada
 *  para rodear la hoja clara donde va la cita (bordes, esquinas, franja de arriba con el logo
 *  y franja de abajo), no para repetirse. Se pintan con currentColor, así toman el color de
 *  texto que se lee bien sobre el color elegido. */
import type { BannerId } from './banners'

const W = 360
const H = 640

function star(x: number, y: number, r: number, o: number): string {
  const k = r * 0.18
  return '<path fill="currentColor" fill-opacity="' + o + '" d="M' + x + ' ' + (y - r) +
    ' C' + (x + k) + ' ' + (y - k) + ' ' + (x + k) + ' ' + (y - k) + ' ' + (x + r) + ' ' + y +
    ' C' + (x + k) + ' ' + (y + k) + ' ' + (x + k) + ' ' + (y + k) + ' ' + x + ' ' + (y + r) +
    ' C' + (x - k) + ' ' + (y + k) + ' ' + (x - k) + ' ' + (y + k) + ' ' + (x - r) + ' ' + y +
    ' C' + (x - k) + ' ' + (y - k) + ' ' + (x - k) + ' ' + (y - k) + ' ' + x + ' ' + (y - r) + 'Z"/>'
}
function dot(x: number, y: number, r: number, o: number): string {
  return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="currentColor" fill-opacity="' + o + '"/>'
}
/** Números "al azar" pero siempre iguales (semilla fija), para que la tarjeta no cambie. */
function seeded(seed: number): () => number {
  let s = seed
  return function () {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
function svg(inner: string): string {
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + '</svg>'
}
function daisy(x: number, y: number, r: number, petals: number, o: number): string {
  let g = ''
  for (let a = 0; a < petals; a++) {
    g += '<ellipse cx="' + x + '" cy="' + (y - r * 0.62) + '" rx="' + (r * 0.34) + '" ry="' + (r * 0.5) + '" fill="currentColor" fill-opacity="' + o + '" transform="rotate(' + (a * 360 / petals) + ' ' + x + ' ' + y + ')"/>'
  }
  return g + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.3) + '" fill="currentColor" fill-opacity="' + Math.min(o + 0.35, 0.85) + '"/>'
}
function tulip(x: number, y: number, h: number, o: number): string {
  return '<path d="M' + x + ' ' + (y + h) + ' Q ' + (x + 2) + ' ' + (y + h / 2) + ' ' + x + ' ' + (y + 6) + '" fill="none" stroke="currentColor" stroke-opacity=".38" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M' + x + ' ' + (y + h - 6) + ' q -11 -5 -12 -17 q 10 4 12 15 z" fill="currentColor" fill-opacity=".3"/>' +
    '<path d="M' + (x - 8) + ' ' + y + ' q 0 -12 3.5 -14 l 4.5 6 l 4.5 -6 q 3.5 2 3.5 14 q 0 9 -8 9 q -8 0 -8 -9 z" fill="currentColor" fill-opacity="' + o + '"/>'
}
function heart(x: number, y: number, r: number, o: number): string {
  return '<path d="M' + x + ' ' + (y + r) + ' C ' + (x - r * 1.6) + ' ' + (y - r * 0.2) + ', ' + (x - r * 0.6) + ' ' + (y - r * 1.4) + ', ' + x + ' ' + (y - r * 0.4) +
    ' C ' + (x + r * 0.6) + ' ' + (y - r * 1.4) + ', ' + (x + r * 1.6) + ' ' + (y - r * 0.2) + ', ' + x + ' ' + (y + r) + ' Z" fill="currentColor" fill-opacity="' + o + '"/>'
}
function leaf(x: number, y: number, rot: number, len: number, o: number): string {
  return '<ellipse cx="' + x + '" cy="' + (y - len / 2) + '" rx="' + (len * 0.32) + '" ry="' + (len / 2) + '" fill="currentColor" fill-opacity="' + o + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>'
}
function glyph(ch: string, x: number, y: number, size: number, o: number, rot = 0): string {
  return '<text x="' + x + '" y="' + y + '" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="' + size + '" fill="currentColor" fill-opacity="' + o + '"' +
    (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '>' + ch + '</text>'
}

const DESIGNS: Record<BannerId, () => string> = {
  /* Luces suaves, una gran órbita que rodea la hoja, estrella fugaz y racimos de destellos. */
  destellos: function () {
    let o = '<defs><filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>' +
      '<linearGradient id="fugaz" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".65"/></linearGradient></defs>'
    o += '<circle cx="30" cy="40" r="90" fill="currentColor" fill-opacity=".14" filter="url(#bl)"/>'
    o += '<circle cx="340" cy="610" r="110" fill="currentColor" fill-opacity=".14" filter="url(#bl)"/>'
    o += '<circle cx="350" cy="260" r="60" fill="currentColor" fill-opacity=".08" filter="url(#bl)"/>'
    o += '<ellipse cx="180" cy="330" rx="230" ry="330" fill="none" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="3 6" transform="rotate(-18 180 330)"/>'
    o += '<ellipse cx="180" cy="330" rx="205" ry="300" fill="none" stroke="currentColor" stroke-opacity=".12" transform="rotate(-18 180 330)"/>'
    o += '<path d="M22 110 L 104 76" stroke="url(#fugaz)" stroke-width="2.6" stroke-linecap="round"/>' + star(106, 75, 8, .75)
    o += '<path d="M250 600 L 318 572" stroke="url(#fugaz)" stroke-width="2" stroke-linecap="round"/>' + star(320, 571, 6, .6)
    o += '<circle cx="306" cy="70" r="20" fill="currentColor" fill-opacity=".08"/>' + star(306, 70, 16, .6) +
      '<line x1="306" y1="38" x2="306" y2="102" stroke="currentColor" stroke-opacity=".2"/><line x1="274" y1="70" x2="338" y2="70" stroke="currentColor" stroke-opacity=".2"/>'
    o += '<circle cx="60" cy="590" r="16" fill="currentColor" fill-opacity=".08"/>' + star(60, 590, 13, .55) +
      '<line x1="60" y1="566" x2="60" y2="614" stroke="currentColor" stroke-opacity=".18"/><line x1="36" y1="590" x2="84" y2="590" stroke="currentColor" stroke-opacity=".18"/>'
    ;[[36, 30, 6, .45], [336, 128, 5, .4], [14, 200, 5, .35], [346, 330, 6, .4], [12, 420, 4, .35], [348, 470, 5, .35], [150, 614, 6, .45], [208, 626, 4, .35], [248, 22, 5, .4], [96, 20, 4, .35], [20, 520, 6, .4]]
      .forEach(function (d) { o += star(d[0], d[1], d[2], d[3]) })
    const r = seeded(11)
    for (let i = 0; i < 40; i++) {
      const x = r() * W, y = r() * H
      if (x > 30 && x < 330 && y > 110 && y < 540) continue
      o += dot(x, y, r() < 0.7 ? 1.2 : 1.9, 0.35 + r() * 0.3)
    }
    return svg(o)
  },

  /* Guirnalda de luces arriba, una enredadera por el costado y el estante con libros abajo. */
  estanteria: function () {
    let o = ''
    function bez(p0: number[], c: number[], p1: number[], t: number): number[] {
      return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]
    }
    const tramos = [[[-10, 6], [45, 34], [100, 12]], [[260, 12], [315, 34], [370, 6]]]
    tramos.forEach(function (tr) {
      o += '<path d="M' + tr[0].join(' ') + ' Q ' + tr[1].join(' ') + ' ' + tr[2].join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".38"/>'
      ;[0.18, 0.42, 0.66, 0.9].forEach(function (t) {
        const p = bez(tr[0], tr[1], tr[2], t)
        o += '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + p[0] + '" y2="' + (p[1] + 4) + '" stroke="currentColor" stroke-opacity=".45"/>'
        o += dot(p[0], p[1] + 9, 8, 0.12) + '<ellipse cx="' + p[0] + '" cy="' + (p[1] + 9) + '" rx="2.8" ry="3.6" fill="currentColor" fill-opacity=".7"/>'
      })
    })
    /* Enredadera que baja por la derecha */
    o += '<path d="M352 0 C 340 80, 360 150, 344 230 S 356 360, 346 430" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width="1.6"/>'
    ;[[349, 40, -40], [343, 80, 40], [354, 120, -30], [345, 168, 45], [352, 210, -35], [344, 262, 40], [353, 310, -40], [346, 356, 35], [350, 400, -30]]
      .forEach(function (l, i) { o += leaf(l[0], l[1], l[2], i % 2 ? 14 : 12, 0.3) })
    /* Cuadrito colgado a la izquierda */
    o += '<path d="M22 150 l 10 -14 l 10 14" fill="none" stroke="currentColor" stroke-opacity=".3"/><rect x="8" y="150" width="30" height="38" rx="3" fill="none" stroke="currentColor" stroke-opacity=".38" stroke-width="1.6"/>' + star(23, 169, 7, .45)
    /* Estante con libros */
    const sy = 612
    o += '<rect x="-10" y="' + sy + '" width="380" height="7" rx="2" fill="currentColor" fill-opacity=".4"/>'
    o += '<path d="M44 ' + (sy + 7) + ' l 0 30 M316 ' + (sy + 7) + ' l 0 30" stroke="currentColor" stroke-opacity=".3" stroke-width="3"/>'
    const books = [[58, 15, 62], [75, 19, 74], [96, 13, 56], [111, 17, 68], [130, 21, 78], [153, 14, 60], [183, 16, 70], [201, 19, 76], [222, 13, 54]]
    books.forEach(function (b, i) {
      const x = b[0], w = b[1], h = b[2], y = sy - h
      const rot = i === 6 ? ' transform="rotate(-10 ' + (x + w) + ' ' + sy + ')"' : ''
      o += '<g' + rot + '><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="currentColor" fill-opacity="' + (0.18 + (i % 3) * 0.08) + '"/>' +
        '<rect x="' + x + '" y="' + (y + 6) + '" width="' + w + '" height="2" fill="currentColor" fill-opacity=".35"/>' +
        '<rect x="' + x + '" y="' + (y + h - 9) + '" width="' + w + '" height="2" fill="currentColor" fill-opacity=".35"/></g>'
    })
    o += '<path d="M40 ' + sy + ' v -32 a 10 10 0 0 1 10 -10 h 4 v 42 z" fill="currentColor" fill-opacity=".3"/>'
    o += '<rect x="244" y="' + (sy - 12) + '" width="48" height="12" rx="2" fill="currentColor" fill-opacity=".3"/><rect x="248" y="' + (sy - 22) + '" width="42" height="10" rx="2" fill="currentColor" fill-opacity=".22"/>'
    o += '<path d="M258 ' + (sy - 40) + ' h 18 v 12 a 6 6 0 0 1 -6 6 h -6 a 6 6 0 0 1 -6 -6 z" fill="currentColor" fill-opacity=".48"/><path d="M276 ' + (sy - 37) + ' q 7 0 7 5 q 0 5 -7 5" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6"/>'
    o += '<path d="M263 ' + (sy - 44) + ' q -3 -5 0 -9 q 3 -4 0 -8 M270 ' + (sy - 44) + ' q -3 -5 0 -9 q 3 -4 0 -8" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-linecap="round"/>'
    o += '<path d="M318 ' + sy + ' l -4 -20 h 26 l -4 20 z" fill="currentColor" fill-opacity=".42"/>'
    ;[[327, sy - 20, -30], [331, sy - 24, 10], [323, sy - 28, -50], [335, sy - 32, 30], [327, sy - 36, -10]].forEach(function (l) { o += leaf(l[0], l[1], l[2], 18, 0.32) })
    return svg(o + star(186, 560, 5, .3) + star(24, 470, 4, .3) + star(40, 40, 4, .3))
  },

  /* Toda la tarjeta es una hoja de cuaderno: espiral, renglones, margen, washi tape y dibujitos. */
  cuaderno: function () {
    let o = ''
    for (let y = 44; y < H; y += 22) o += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="currentColor" stroke-opacity=".16"/>'
    o += '<line x1="36" x2="36" y1="24" y2="' + H + '" stroke="currentColor" stroke-opacity=".38"/><line x1="40" x2="40" y1="24" y2="' + H + '" stroke="currentColor" stroke-opacity=".2"/>'
    for (let x = 22; x < W; x += 26) o += '<ellipse cx="' + x + '" cy="10" rx="4.5" ry="10" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.7"/>' + dot(x, 22, 2.6, 0.35)
    function washi(cx: number, cy: number, rot: number): string {
      let g = '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"><rect x="' + (cx - 34) + '" y="' + (cy - 9) + '" width="68" height="18" fill="currentColor" fill-opacity=".26"/>'
      for (let k = 0; k < 6; k++) g += '<line x1="' + (cx - 28 + k * 11) + '" y1="' + (cy - 9) + '" x2="' + (cx - 33 + k * 11) + '" y2="' + (cy + 9) + '" stroke="currentColor" stroke-opacity=".22"/>'
      return g + '</g>'
    }
    o += washi(328, 118, 36) + washi(34, 548, -30)
    /* Lista con casillas abajo */
    ;([[60, 588, true], [60, 610, true], [60, 632, false]] as [number, number, boolean][]).forEach(function (c, i) {
      o += '<rect x="' + c[0] + '" y="' + (c[1] - 9) + '" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-opacity=".5"/>'
      if (c[2]) o += '<path d="M' + (c[0] + 2) + ' ' + (c[1] - 4) + ' l 2.5 3 l 5.5 -7" fill="none" stroke="currentColor" stroke-opacity=".65" stroke-width="1.5" stroke-linecap="round"/>'
      o += '<line x1="' + (c[0] + 18) + '" y1="' + (c[1] - 4) + '" x2="' + (c[0] + 70 + i * 16) + '" y2="' + (c[1] - 4) + '" stroke="currentColor" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>'
    })
    o += '<path d="M290 602 c -9 -9 -20 0 -11 11 l 11 11 l 11 -11 c 9 -11 -2 -20 -11 -11 z" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.6"/>'
    o += star(328, 584, 10, .45) + star(240, 628, 6, .35)
    o += '<path d="M190 590 q 26 -16 52 -4" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M238 580 l 6 6 l -8 3" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.5"/>'
    o += glyph('notas', 58, 76, 18, 0.45) + '<path d="M58 84 q 24 5 50 0" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="1.5" stroke-linecap="round"/>'
    o += '<path d="M344 300 v -30 a 6 6 0 0 1 12 0 v 34 a 9 9 0 0 1 -18 0 v -24" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.8"/>'
    return svg(o)
  },

  /* Cielo estrellado completo: el libro de estrellas abajo, luna creciente y cometa arriba. */
  constelacion: function () {
    let o = ''
    const r = seeded(5)
    for (let i = 0; i < 120; i++) {
      const x = r() * W, y = r() * H, s = r()
      o += dot(x, y, s < 0.7 ? 0.9 : s < 0.92 ? 1.4 : 2, 0.28 + s * 0.4)
    }
    const pts = [[118, 618], [146, 604], [180, 614], [214, 604], [242, 618], [242, 580], [214, 568], [180, 578], [146, 568], [118, 580]]
    o += '<polyline points="' + pts.concat([pts[0]]).map(function (p) { return p.join(',') }).join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1.1"/>'
    o += '<line x1="180" y1="578" x2="180" y2="614" stroke="currentColor" stroke-opacity=".35" stroke-width="1.1"/>'
    pts.forEach(function (p, i) { o += dot(p[0], p[1], i % 3 === 0 ? 3.2 : 2.2, 0.8) + dot(p[0], p[1], 6.5, 0.08) })
    o += '<path d="M316 36 a 22 22 0 1 0 16 38 a 18 18 0 1 1 -16 -38 z" fill="currentColor" fill-opacity=".55"/>'
    o += '<path d="M20 58 Q 56 70 88 64" fill="none" stroke="currentColor" stroke-opacity=".38" stroke-width="1.8" stroke-linecap="round"/><path d="M24 66 Q 56 76 86 67" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-linecap="round"/>' + star(91, 63, 6, .65)
    const side = [[16, 180], [34, 214], [20, 250], [38, 282]]
    o += '<polyline points="' + side.map(function (p) { return p.join(',') }).join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".28"/>'
    side.forEach(function (p) { o += dot(p[0], p[1], 2.2, 0.65) })
    const side2 = [[344, 360], [326, 392], [346, 420], [330, 452], [348, 480]]
    o += '<polyline points="' + side2.map(function (p) { return p.join(',') }).join(' ') + '" fill="none" stroke="currentColor" stroke-opacity=".28"/>'
    side2.forEach(function (p) { o += dot(p[0], p[1], 2.2, 0.65) })
    return svg(o + star(180, 548, 7, .55) + star(60, 600, 5, .4) + star(300, 596, 5, .4) + star(240, 36, 5, .4) + star(20, 400, 4, .35) + star(346, 200, 5, .4))
  },

  /* Marco de ex libris alrededor de toda la tarjeta, con esquinas y el emblema abajo. */
  exlibris: function () {
    let o = ''
    o += '<rect x="10" y="10" width="340" height="620" rx="14" fill="none" stroke="currentColor" stroke-opacity=".42" stroke-width="1.6"/>'
    o += '<rect x="18" y="18" width="324" height="604" rx="9" fill="none" stroke="currentColor" stroke-opacity=".24" stroke-dasharray="2 4"/>'
    ;[[10, 10, 1, 1], [350, 10, -1, 1], [10, 630, 1, -1], [350, 630, -1, -1]].forEach(function (c) {
      const x = c[0], y = c[1], sx = c[2], sy = c[3]
      o += '<path d="M' + x + ' ' + (y + sy * 44) + ' Q ' + (x + sx * 6) + ' ' + (y + sy * 6) + ' ' + (x + sx * 44) + ' ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6"/>'
      o += '<path d="M' + x + ' ' + (y + sy * 30) + ' Q ' + (x + sx * 16) + ' ' + (y + sy * 16) + ' ' + (x + sx * 30) + ' ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".3"/>'
      o += dot(x + sx * 16, y + sy * 16, 3.4, 0.5)
      o += '<path d="M' + (x + sx * 30) + ' ' + (y + sy * 30) + ' l ' + (sx * 5) + ' ' + (sy * -5) + ' l ' + (sx * 5) + ' ' + (sy * 5) + ' l ' + (sx * -5) + ' ' + (sy * 5) + ' z" fill="currentColor" fill-opacity=".4"/>'
    })
    ;[[10, 320], [350, 320]].forEach(function (p) {
      o += '<path d="M' + p[0] + ' ' + (p[1] - 10) + ' l 6 10 l -6 10 l -6 -10 z" fill="currentColor" fill-opacity=".45"/>'
    })
    const cx = 180, cy = 594
    o += '<path d="M' + (cx - 26) + ' ' + (cy - 12) + ' Q ' + (cx - 13) + ' ' + (cy - 18) + ' ' + cx + ' ' + (cy - 10) + ' Q ' + (cx + 13) + ' ' + (cy - 18) + ' ' + (cx + 26) + ' ' + (cy - 12) + ' L ' + (cx + 26) + ' ' + (cy + 12) + ' Q ' + (cx + 13) + ' ' + (cy + 6) + ' ' + cx + ' ' + (cy + 14) + ' Q ' + (cx - 13) + ' ' + (cy + 6) + ' ' + (cx - 26) + ' ' + (cy + 12) + ' Z" fill="currentColor" fill-opacity=".32" stroke="currentColor" stroke-opacity=".5"/>'
    o += '<line x1="' + cx + '" y1="' + (cy - 10) + '" x2="' + cx + '" y2="' + (cy + 14) + '" stroke="currentColor" stroke-opacity=".5"/>'
    ;[-1, 1].forEach(function (side) {
      o += '<path d="M' + (cx + side * 34) + ' ' + (cy + 20) + ' Q ' + (cx + side * 52) + ' ' + cy + ' ' + (cx + side * 40) + ' ' + (cy - 22) + '" fill="none" stroke="currentColor" stroke-opacity=".4"/>'
      for (let l = 0; l < 5; l++) {
        const t = l / 4, lx = cx + side * (36 + 12 * Math.sin(t * Math.PI)), ly = cy + 18 - t * 38
        o += '<ellipse cx="' + lx + '" cy="' + ly + '" rx="2.6" ry="5.5" fill="currentColor" fill-opacity=".4" transform="rotate(' + (side * (40 - t * 60)) + ' ' + lx + ' ' + ly + ')"/>'
      }
      o += '<line x1="' + (cx + side * 66) + '" y1="' + cy + '" x2="' + (cx + side * 120) + '" y2="' + cy + '" stroke="currentColor" stroke-opacity=".3"/>' + star(cx + side * 128, cy, 4, .4)
      o += '<line x1="' + (cx + side * 56) + '" y1="46" x2="' + (cx + side * 120) + '" y2="46" stroke="currentColor" stroke-opacity=".3"/>' + star(cx + side * 128, 46, 4, .4)
    })
    return svg(o + star(cx, cy - 32, 6, .55))
  },

  /* Sol y gaviotas arriba; mar en capas abajo con el barquito de papel navegando. */
  barco: function () {
    let o = ''
    o += dot(306, 88, 22, 0.3) + '<circle cx="306" cy="88" r="32" fill="none" stroke="currentColor" stroke-opacity=".16"/><circle cx="306" cy="88" r="42" fill="none" stroke="currentColor" stroke-opacity=".08"/>'
    ;[[40, 70], [66, 86], [96, 60], [30, 120]].forEach(function (b) { o += '<path d="M' + (b[0] - 7) + ' ' + b[1] + ' q 3.5 -5 7 0 q 3.5 -5 7 0" fill="none" stroke="currentColor" stroke-opacity=".48" stroke-width="1.4" stroke-linecap="round"/>' })
    function cloud(x: number, y: number, sc: number, op: number): string {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" fill="currentColor" opacity="' + op + '"><circle cx="0" cy="4" r="12"/><circle cx="18" cy="-4" r="17"/><circle cx="36" cy="4" r="12"/><rect x="0" y="4" width="36" height="12" rx="6"/></g>'
    }
    o += cloud(-6, 22, 0.9, 0.16) + cloud(310, 150, 0.7, 0.14)
    const layers = [[560, .14], [576, .2], [596, .28], [616, .36]]
    layers.forEach(function (L, n) {
      let d = 'M-10 ' + L[0]
      for (let x = -10; x < 380; x += 40) d += ' q 10 -' + (8 - n) + ' 20 0 t 20 0'
      o += '<path d="' + d + ' L 380 660 L -10 660 Z" fill="currentColor" fill-opacity="' + L[1] + '"/>'
    })
    const bx = 96, by = 566
    o += '<path d="M' + (bx - 40) + ' ' + by + ' L ' + (bx + 40) + ' ' + by + ' L ' + (bx + 26) + ' ' + (by + 16) + ' L ' + (bx - 26) + ' ' + (by + 16) + ' Z" fill="currentColor" fill-opacity=".55"/>'
    o += '<path d="M' + bx + ' ' + (by - 44) + ' L ' + (bx + 28) + ' ' + by + ' L ' + (bx - 28) + ' ' + by + ' Z" fill="currentColor" fill-opacity=".38"/>'
    o += '<path d="M' + bx + ' ' + (by - 44) + ' L ' + bx + ' ' + by + '" stroke="currentColor" stroke-opacity=".5"/>'
    for (let k = 1; k < 4; k++) o += '<line x1="' + (bx - 20 + k * 2) + '" y1="' + (by - 7 - k * 8) + '" x2="' + (bx - 3) + '" y2="' + (by - 7 - k * 8) + '" stroke="currentColor" stroke-opacity=".3"/>'
    o += '<path d="M280 574 l 20 0 l -6 7 l -8 0 z M290 574 l 0 -20 l 11 20 z" fill="currentColor" fill-opacity=".3"/>'
    ;[[30, 600], [160, 610], [230, 596], [330, 612], [200, 630], [70, 628]].forEach(function (f) { o += dot(f[0], f[1], 1.8, 0.55) })
    return svg(o + star(240, 52, 5, .4) + star(150, 30, 4, .3) + star(344, 250, 4, .3) + star(16, 330, 4, .3))
  },

  /* Macizo de flores abajo, enredaderas con margaritas por los costados y pétalos arriba. */
  jardin: function () {
    let o = ''
    o += '<path d="M-10 640 C 40 600, 90 614, 140 604 S 250 590, 300 606 S 360 600, 380 592 L 380 660 L -10 660 Z" fill="currentColor" fill-opacity=".12"/>'
    ;[[16, 616, -30], [52, 610, 25], [98, 616, -20], [166, 606, 30], [208, 614, -25], [256, 604, 20], [312, 610, -30], [344, 602, 25]]
      .forEach(function (l) { o += leaf(l[0], l[1], l[2], 20, 0.28) })
    o += tulip(76, 572, 36, .52) + tulip(232, 566, 40, .46) + tulip(298, 578, 32, .42)
    o += daisy(34, 590, 16, 8, .46) + daisy(140, 594, 13, 7, .42) + daisy(188, 582, 18, 9, .52) + daisy(334, 578, 14, 8, .46)
    /* Enredaderas que suben por los dos costados */
    o += '<path d="M8 600 C 22 520, 2 440, 16 360 S 6 240, 18 170" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width="1.6"/>'
    o += '<path d="M352 600 C 338 520, 358 440, 344 360 S 354 250, 342 190" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width="1.6"/>'
    ;[[12, 540, 40], [8, 480, -40], [16, 420, 35], [9, 350, -35], [16, 290, 40], [11, 230, -30]].forEach(function (l, i) { o += leaf(l[0], l[1], l[2], i % 2 ? 13 : 15, 0.3) })
    ;[[348, 540, -40], [352, 470, 40], [344, 400, -35], [352, 330, 35], [344, 260, -40]].forEach(function (l, i) { o += leaf(l[0], l[1], l[2], i % 2 ? 13 : 15, 0.3) })
    o += daisy(18, 168, 9, 7, .45) + daisy(342, 188, 10, 7, .45) + daisy(14, 400, 6, 6, .38) + daisy(348, 420, 6, 6, .38)
    /* Arriba: florecitas, pétalos y corazones que flotan */
    o += daisy(40, 50, 11, 7, .42) + daisy(320, 44, 12, 8, .42) + daisy(92, 104, 7, 6, .34) + daisy(272, 108, 7, 6, .34)
    function petal(x: number, y: number, rot: number, op: number): string {
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="2.8" ry="5" fill="currentColor" fill-opacity="' + op + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')"/>'
    }
    o += petal(76, 30, 30, .35) + petal(258, 70, -40, .3) + petal(346, 110, 60, .3) + petal(20, 110, -20, .28) + petal(126, 84, 15, .28) + petal(230, 24, 45, .3)
    o += heart(150, 96, 5, .4) + heart(214, 94, 4.5, .35) + heart(300, 86, 4, .35) + heart(60, 150, 3.5, .3)
    return svg(o)
  },

  /* Comillas grandes en las esquinas, letras que suben por los costados y el libro abajo. */
  citas: function () {
    let o = ''
    o += glyph('“', 6, 150, 150, 0.16) + glyph('”', 254, 560, 150, 0.16)
    const cx = 180, by = 626
    o += '<path d="M' + (cx - 96) + ' ' + (by - 26) + ' Q ' + (cx - 48) + ' ' + (by - 44) + ' ' + cx + ' ' + (by - 28) + ' Q ' + (cx + 48) + ' ' + (by - 44) + ' ' + (cx + 96) + ' ' + (by - 26) + ' L ' + (cx + 96) + ' ' + (by + 20) + ' L ' + (cx - 96) + ' ' + (by + 20) + ' Z" fill="currentColor" fill-opacity=".32"/>'
    o += '<path d="M' + cx + ' ' + (by - 28) + ' L ' + cx + ' ' + (by + 20) + '" stroke="currentColor" stroke-opacity=".5"/>'
    for (let k = 0; k < 2; k++) {
      const y = by - 20 + k * 8
      o += '<path d="M' + (cx - 82) + ' ' + (y + 2) + ' Q ' + (cx - 44) + ' ' + (y - 9) + ' ' + (cx - 8) + ' ' + y + '" fill="none" stroke="currentColor" stroke-opacity=".35"/>'
      o += '<path d="M' + (cx + 8) + ' ' + y + ' Q ' + (cx + 44) + ' ' + (y - 9) + ' ' + (cx + 82) + ' ' + (y + 2) + '" fill="none" stroke="currentColor" stroke-opacity=".35"/>'
    }
    o += '<path d="M' + (cx + 34) + ' ' + (by - 36) + ' l 0 34 l 5 -6 l 5 6 l 0 -36" fill="currentColor" fill-opacity=".45"/>'
    o += '<path d="M' + (cx - 60) + ' ' + (by - 34) + ' C 40 540, 0 420, 22 300" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 5"/>'
    o += '<path d="M' + (cx + 60) + ' ' + (by - 34) + ' C 320 540, 360 420, 338 300" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 5"/>'
    const letters = [['a', 30, 520, 18, .45, -10], ['T', 12, 452, 16, .4, 8], ['e', 28, 380, 14, .38, -6], ['s', 14, 320, 13, .34, 10], ['”', 22, 262, 22, .3, 0],
      ['o', 330, 528, 18, .45, 10], ['L', 342, 460, 16, .4, -8], ['r', 330, 392, 14, .38, 6], ['i', 344, 330, 14, .34, -10], ['“', 330, 270, 22, .3, 0]]
    letters.forEach(function (g) { o += glyph(g[0] as string, g[1] as number, g[2] as number, g[3] as number, g[4] as number, g[5] as number) })
    return svg(o + star(306, 40, 6, .45) + star(56, 30, 4, .35) + star(250, 80, 4, .3) + star(100, 590, 4, .35) + star(262, 588, 5, .35))
  },

  /* Cielo nocturno completo con la luna llena asomando arriba y nubes finas abajo. */
  luna: function () {
    let o = '<defs><filter id="lunaglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>'
    const r = seeded(7)
    for (let i = 0; i < 130; i++) {
      const x = r() * W, y = r() * H, s = r()
      if (Math.hypot(x - 300, y - 74) < 62) continue
      o += dot(x, y, s < 0.7 ? 0.8 : s < 0.92 ? 1.3 : 1.9, 0.25 + s * 0.45)
    }
    ;[[40, 40, 6, .45], [120, 90, 4, .35], [214, 28, 5, .4], [20, 300, 5, .35], [344, 360, 5, .35], [30, 520, 6, .4], [336, 560, 4, .35], [180, 610, 5, .4], [100, 630, 4, .3], [344, 190, 4, .35]]
      .forEach(function (d) { o += star(d[0], d[1], d[2], d[3]) })
    const mx = 300, my = 74, mr = 42
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 20) + '" fill="currentColor" fill-opacity=".18" filter="url(#lunaglow)"/>'
    o += '<circle cx="' + mx + '" cy="' + my + '" r="' + (mr + 12) + '" fill="none" stroke="currentColor" stroke-opacity=".15"/>'
    o += dot(mx, my, mr, 0.5)
    ;[[-14, -10, 8], [11, 8, 11], [16, -20, 5], [-16, 17, 5], [-3, 25, 4]].forEach(function (c) { o += dot(mx + c[0], my + c[1], c[2], 0.22) })
    o += '<path d="M40 612 q 14 -14 30 -6 q 10 -14 28 -3 q 16 -3 20 11 z" fill="currentColor" fill-opacity=".16"/>'
    o += '<path d="M226 628 q 12 -12 26 -5 q 9 -12 24 -2 q 14 -2 17 9 z" fill="currentColor" fill-opacity=".14"/>'
    o += '<path d="M8 150 q 10 -10 22 -4 q 8 -10 20 -2 q 12 -2 14 8 z" fill="currentColor" fill-opacity=".12"/>'
    return svg(o)
  },

  /* Nubes arriba, lluvia por toda la tarjeta y abajo el paraguas cuidando los libros. */
  lluvia: function () {
    let o = ''
    function cloud(x: number, y: number, sc: number, op: number): string {
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" fill="currentColor" opacity="' + op + '"><circle cx="0" cy="4" r="12"/><circle cx="18" cy="-4" r="17"/><circle cx="36" cy="4" r="12"/><rect x="0" y="4" width="36" height="12" rx="6"/></g>'
    }
    function drop(x: number, y: number, sz: number, op: number): string {
      return '<path d="M' + x + ' ' + (y - sz) + ' C ' + (x + sz * 0.8) + ' ' + (y - sz * 0.1) + ', ' + (x + sz * 0.7) + ' ' + (y + sz * 0.8) + ', ' + x + ' ' + (y + sz * 0.8) + ' C ' + (x - sz * 0.7) + ' ' + (y + sz * 0.8) + ', ' + (x - sz * 0.8) + ' ' + (y - sz * 0.1) + ', ' + x + ' ' + (y - sz) + ' Z" fill="currentColor" fill-opacity="' + op + '"/>'
    }
    o += cloud(10, 30, 1.3, 0.24) + cloud(278, 26, 1.2, 0.22) + cloud(60, 96, 0.8, 0.16) + cloud(250, 104, 0.7, 0.14)
    const r = seeded(3)
    for (let i = 0; i < 46; i++) {
      const x = r() * W, y = 120 + r() * 420
      if (i % 3 === 0) o += drop(x, y, 3 + r() * 1.5, 0.3 + r() * 0.25)
      else o += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (x - 3).toFixed(1) + '" y2="' + (y + 10).toFixed(1) + '" stroke="currentColor" stroke-opacity=".28" stroke-linecap="round"/>'
    }
    const ux = 286, uy = 566
    o += '<path d="M' + (ux - 50) + ' ' + uy + ' Q ' + ux + ' ' + (uy - 52) + ' ' + (ux + 50) + ' ' + uy + ' q -12.5 -8 -25 0 q -12.5 -8 -25 0 q -12.5 -8 -25 0 q -12.5 -8 -25 0 z" fill="currentColor" fill-opacity=".48"/>'
    o += '<path d="M' + ux + ' ' + (uy - 26) + ' Q ' + (ux - 8) + ' ' + (uy - 10) + ' ' + (ux - 25) + ' ' + uy + ' M' + ux + ' ' + (uy - 26) + ' Q ' + (ux + 8) + ' ' + (uy - 10) + ' ' + (ux + 25) + ' ' + uy + ' M' + ux + ' ' + (uy - 26) + ' L ' + ux + ' ' + uy + '" fill="none" stroke="currentColor" stroke-opacity=".3"/>'
    o += '<line x1="' + ux + '" y1="' + (uy - 26) + '" x2="' + ux + '" y2="' + (uy - 33) + '" stroke="currentColor" stroke-opacity=".5" stroke-width="2"/>'
    o += '<path d="M' + ux + ' ' + uy + ' L ' + ux + ' ' + (uy + 44) + ' q 0 8 -8 8 q -6 0 -6 -6" fill="none" stroke="currentColor" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>'
    o += '<rect x="246" y="604" width="46" height="11" rx="2" fill="currentColor" fill-opacity=".32"/><rect x="250" y="593" width="40" height="11" rx="2" fill="currentColor" fill-opacity=".24"/><rect x="248" y="615" width="48" height="11" rx="2" fill="currentColor" fill-opacity=".38"/>'
    o += '<path d="M302 610 h 15 v 10 a 5 5 0 0 1 -5 5 h -5 a 5 5 0 0 1 -5 -5 z" fill="currentColor" fill-opacity=".45"/>'
    ;[[70, 616, 26], [150, 628, 16], [40, 634, 10]].forEach(function (c) {
      o += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="4" fill="none" stroke="currentColor" stroke-opacity=".32"/><ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + (c[2] / 2) + '" ry="2" fill="none" stroke="currentColor" stroke-opacity=".24"/>'
    })
    ;[[60, 580], [120, 596], [180, 574], [30, 560]].forEach(function (d, i) { o += drop(d[0], d[1], 4, i % 2 ? 0.35 : 0.5) })
    return svg(o)
  },
}

/** SVG de la decoración de la tarjeta de cita para ese banner. `uid` hace únicos los ids
 *  internos (filtros y degradados), igual que en bannerSvg. */
export function quoteCardSvg(id: BannerId, uid: string): string {
  const draw = DESIGNS[id] ?? DESIGNS.destellos
  return draw()
    .replace(/id="([^"]+)"/g, `id="$1-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1-${uid})`)
}
