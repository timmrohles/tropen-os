// Lädt .env.local und überschreibt LEERE/fehlende Env-Vars (umgeht die Harness Empty-Key-Shadow-Falle).
// Side-Effect-Import: muss vor den Provider-Calls laufen. Druckt nie Werte.
import { readFileSync } from 'fs'
import { resolve } from 'path'

try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    const val = m[2].trim().replace(/^['"]|['"]$/g, '')
    if (val && !process.env[key]) process.env[key] = val // nur setzen, wenn vorhandener Wert leer/fehlt
  }
} catch {
  // .env.local optional
}
