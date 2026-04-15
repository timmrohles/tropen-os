// src/lib/benchmark/repo-discovery.ts
// Discovers relevant public repos via GitHub Search API.

export interface RepoCandidate {
  owner: string
  repo: string
  url: string
  stars: number
  lastPush: string
  language: string
  defaultBranch: string
}

interface SearchOptions {
  topic?: string
  minStars?: number
  maxResults?: number
  language?: string
  pushedAfter?: string
}

const DEFAULTS: Required<SearchOptions> = {
  topic: 'lovable-dev',
  minStars: 0,
  maxResults: 10,
  language: 'TypeScript',
  pushedAfter: '2024-01-01',
}

export async function discoverRepos(
  token: string,
  opts: SearchOptions = {},
): Promise<RepoCandidate[]> {
  const o = { ...DEFAULTS, ...opts }

  const q = [
    o.topic ? `topic:${o.topic}` : '',
    o.language ? `language:${o.language}` : '',
    `pushed:>${o.pushedAfter}`,
    'archived:false',
    'fork:false',
  ].filter(Boolean).join(' ')

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'tropen-os-benchmark',
  }

  const results: RepoCandidate[] = []
  const seen = new Set<string>()
  const pagesNeeded = Math.ceil(o.maxResults / 100)

  for (let page = 1; page <= pagesNeeded && results.length < o.maxResults; page++) {
    const url = new URL('https://api.github.com/search/repositories')
    url.searchParams.set('q', q)
    url.searchParams.set('sort', 'updated')
    url.searchParams.set('order', 'desc')
    url.searchParams.set('per_page', '100')
    url.searchParams.set('page', String(page))

    const res = await fetch(url.toString(), { headers })

    if (!res.ok) {
      throw new Error(`GitHub search failed: ${res.status} ${res.statusText}`)
    }

    const data = await res.json() as {
      items: Array<{
        full_name: string
        html_url: string
        stargazers_count: number
        pushed_at: string
        language: string | null
        default_branch: string
        archived: boolean
        fork: boolean
      }>
    }

    if (!data.items?.length) break

    for (const r of data.items) {
      if (r.archived || r.fork) continue
      if (seen.has(r.full_name)) continue
      seen.add(r.full_name)

      const [owner, repo] = r.full_name.split('/')
      results.push({
        owner,
        repo,
        url: r.html_url,
        stars: r.stargazers_count,
        lastPush: r.pushed_at,
        language: r.language ?? 'unknown',
        defaultBranch: r.default_branch,
      })

      if (results.length >= o.maxResults) break
    }
  }

  return results
}
