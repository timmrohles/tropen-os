// Dev-Wrapper: entfernt LEERE API-Key-Env-Variablen vor `next dev`.
//
// Warum: Manche Shells/CI-Umgebungen exportieren Keys wie ANTHROPIC_API_KEY als
// leeren String (""). Nexts Env-Loader (@next/env → dotenv) überschreibt bereits
// in process.env vorhandene Keys NICHT — ein geerbter Leerwert gewinnt also über
// den echten Wert in .env.local. Folge: LLM-Calls scheitern lokal mit
// "x-api-key header is required", obwohl der Key in .env.local steht.
//
// Dieser Wrapper löscht ausschließlich Keys, die als Leerstring gesetzt sind —
// echte (nicht-leere) Werte bleiben unangetastet. Danach kann dotenv den Wert
// aus .env.local laden.
import { spawn } from 'node:child_process'

const KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'XAI_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'AI_GATEWAY_API_KEY',
]

for (const k of KEYS) {
  const v = process.env[k]
  if (v !== undefined && v.trim() === '') {
    delete process.env[k]
  }
}

const child = spawn('next dev', { stdio: 'inherit', shell: true, env: process.env })
child.on('exit', (code) => process.exit(code ?? 0))
