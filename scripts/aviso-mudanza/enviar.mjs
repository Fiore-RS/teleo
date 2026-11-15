// Aviso de la mudanza a teleo.fiorers.dev y de la Versión 4 (15 nov 2026), por correo, una sola vez.
// Envía supabase/templates/aviso-mudanza-v4.html con Resend (lotes de hasta 100), desde
// teleo@fiorers.dev, con el saludo personalizado con el nickname de cada persona.
//
// Uso (desde la raíz del repo, con Node 18 o más nuevo):
//   1. Exportar la lista desde Supabase (ver LEEME en el plan) a scripts/aviso-mudanza/usuarios.csv
//      con las columnas email y first_name. Ese archivo NO se sube a git (.gitignore).
//   2. Revisar sin enviar nada:   node scripts/aviso-mudanza/enviar.mjs
//   3. Probar contigo:            node scripts/aviso-mudanza/enviar.mjs --prueba tu@correo.com
//   4. Enviar a todas las cuentas: node scripts/aviso-mudanza/enviar.mjs --enviar
// La clave va en la variable RESEND_API_KEY (una clave de Resend con permiso de envío para
// fiorers.dev). En PowerShell: $env:RESEND_API_KEY="re_..."
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const FROM = 'Teleo: Diario de Lectura <teleo@fiorers.dev>'
const SUBJECT = 'Teleo tiene casa nueva'
const LOTE = 100

const args = process.argv.slice(2)
const pruebaIdx = args.indexOf('--prueba')
const prueba = pruebaIdx >= 0 ? args[pruebaIdx + 1] : null
const enviar = args.includes('--enviar')

const plantilla = readFileSync(join(root, 'supabase', 'templates', 'aviso-mudanza-v4.html'), 'utf8')
if (!plantilla.includes('{{SALUDO}}')) throw new Error('La plantilla no tiene {{SALUDO}}.')

function escapar(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function htmlPara(nombre) {
  const saludo = nombre ? `¡Hola, ${escapar(nombre)}!` : '¡Hola!'
  return plantilla.replace('{{SALUDO}}', saludo)
}

function textoPara(nombre) {
  return [
    nombre ? `¡Hola, ${nombre}!` : '¡Hola!',
    '',
    'Teleo se mudó a su propia dirección: teleo.fiorers.dev. Tus libros, reseñas, citas y preferencias están guardados en tu cuenta, así que todo te espera igual.',
    '',
    'Con la mudanza llega la Versión 4, En cualquier mesa: Teleo ahora también se usa en la computadora y la tableta, y en el teléfono estrena hojas de cuaderno, un librero de madera y cambios que aparecen al momento en todos tus dispositivos.',
    '',
    'Si tienes Teleo instalada en tu teléfono:',
    '1. Abre https://teleo.fiorers.dev/ en el navegador de tu teléfono.',
    '2. Inicia sesión con tu correo y contraseña de siempre.',
    '3. Instálala otra vez desde la dirección nueva y borra la anterior. La página Instalar te guía: https://teleo.fiorers.dev/#/instalar',
    '',
    'En la computadora no hace falta instalar nada: abre teleo.fiorers.dev en tu navegador e inicia sesión.',
    '',
    'Gracias por leer con Teleo.',
    'Fiorella',
  ].join('\n')
}

// CSV simple con comillas (como lo exporta Supabase).
function leerCsv(texto) {
  const filas = []
  let fila = []
  let campo = ''
  let comillas = false
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') comillas = false
      else campo += c
    } else if (c === '"') comillas = true
    else if (c === ',') { fila.push(campo); campo = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++
      fila.push(campo); campo = ''
      if (fila.some((f) => f !== '')) filas.push(fila)
      fila = []
    } else campo += c
  }
  fila.push(campo)
  if (fila.some((f) => f !== '')) filas.push(fila)
  const [cabecera, ...resto] = filas
  const iEmail = cabecera.indexOf('email')
  const iNombre = cabecera.indexOf('first_name')
  if (iEmail < 0) throw new Error('El CSV necesita una columna "email".')
  const vistos = new Set()
  return resto
    .map((f) => ({ email: (f[iEmail] ?? '').trim(), nombre: iNombre >= 0 ? (f[iNombre] ?? '').trim() : '' }))
    .filter((p) => {
      const clave = p.email.toLowerCase()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email) || vistos.has(clave)) return false
      vistos.add(clave)
      return true
    })
}

const personas = leerCsv(readFileSync(join(here, 'usuarios.csv'), 'utf8'))
console.log(`${personas.length} cuentas en la lista.`)

if (!prueba && !enviar) {
  for (const p of personas) console.log(`  ${p.email}  (${p.nombre || 'sin nombre'})`)
  console.log('\nNo se envió nada. Usa --prueba tu@correo.com para probar, o --enviar para enviar a todas.')
  process.exit(0)
}

const clave = process.env.RESEND_API_KEY
if (!clave) throw new Error('Falta RESEND_API_KEY.')

async function enviarLote(lote) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(
      lote.map((p) => ({ from: FROM, to: [p.email], subject: SUBJECT, html: htmlPara(p.nombre), text: textoPara(p.nombre) })),
    ),
  })
  const cuerpo = await res.text()
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${cuerpo}`)
  return cuerpo
}

if (prueba) {
  const nombre = personas[0]?.nombre ?? ''
  await enviarLote([{ email: prueba, nombre }])
  console.log(`Prueba enviada a ${prueba} (con el saludo de ${nombre || 'sin nombre'}).`)
  process.exit(0)
}

for (let i = 0; i < personas.length; i += LOTE) {
  const lote = personas.slice(i, i + LOTE)
  await enviarLote(lote)
  console.log(`Enviados ${Math.min(i + LOTE, personas.length)} de ${personas.length}.`)
}
console.log('Listo. Revisa Resend › Emails para ver cada envío.')
