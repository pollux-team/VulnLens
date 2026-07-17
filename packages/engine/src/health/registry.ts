const NPM_REGISTRY = 'https://registry.npmjs.org'

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

export async function fetchNpmMetadata(name) {
  const cached = cache.get(name)
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data
  }

  try {
    const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}`, {
      headers: { Accept: 'application/vnd.npm.install-v1+json' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return { latest: null, deprecated: false, deprecationMsg: null, versions: [] }
    }

    const data = await res.json()
    const latest = data['dist-tags']?.latest ?? null
    const versions = Object.keys(data.versions ?? {}).sort().reverse()
    const entry = latest ? data.versions?.[latest] : null
    const deprecated = entry?.deprecated === true || typeof entry?.deprecated === 'string'
    const deprecationMsg = typeof entry?.deprecated === 'string' ? entry.deprecated : null

    const result = { latest, deprecated, deprecationMsg, versions }
    cache.set(name, { data: result, time: Date.now() })
    return result
  } catch {
    return { latest: null, deprecated: false, deprecationMsg: null, versions: [] }
  }
}
