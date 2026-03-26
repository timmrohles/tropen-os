// src/lib/feeds/ssrf-guard.ts
// Schützt vor SSRF: blockiert private/interne IPs bei User-supplied URLs.
import dns from 'node:dns/promises'

const BLOCKED_IPV4 = [
  /^127\./,                              // loopback
  /^10\./,                               // RFC-1918
  /^172\.(1[6-9]|2\d|3[01])\./,         // RFC-1918
  /^192\.168\./,                         // RFC-1918
  /^169\.254\./,                         // link-local / AWS metadata endpoint
  /^0\./,                                // "this" network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT (RFC-6598)
]

const BLOCKED_IPV6 = [
  /^::1$/,     // loopback
  /^fc/i,      // unique local
  /^fd/i,      // unique local
  /^fe[89ab]/i, // link-local
  /^::/,       // unspecified / mapped
]

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) return BLOCKED_IPV6.some(r => r.test(ip))
  return BLOCKED_IPV4.some(r => r.test(ip))
}

export async function isSafeUrl(rawUrl: string): Promise<{ safe: boolean; reason?: string }> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { safe: false, reason: 'invalid URL' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { safe: false, reason: `disallowed protocol: ${parsed.protocol}` }
  }

  // Direkte IP-Eingabe abfangen (kein DNS-Lookup nötig)
  if (isPrivateIp(parsed.hostname)) {
    return { safe: false, reason: `private IP: ${parsed.hostname}` }
  }

  // DNS auflösen und alle A/AAAA-Records prüfen
  const [v4, v6] = await Promise.all([
    dns.resolve4(parsed.hostname).catch(() => [] as string[]),
    dns.resolve6(parsed.hostname).catch(() => [] as string[]),
  ])
  const all = [...v4, ...v6]
  if (all.length === 0) {
    return { safe: false, reason: 'DNS resolution failed' }
  }
  const blocked = all.find(isPrivateIp)
  if (blocked) {
    return { safe: false, reason: `resolves to private IP: ${blocked}` }
  }

  return { safe: true }
}
