import { readFile } from 'node:fs/promises'

import { fetchNpmMetadata } from './registry.js'
import { queryVulnerabilityScores } from './vulnerability.js'

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]

export async function checkPackageHealth(manifestPath, options) {
  if (!manifestPath.endsWith('package.json')) return []

  let content
  try {
    content = await readFile(manifestPath, 'utf-8')
  } catch {
    return []
  }

  let pkg
  try {
    pkg = JSON.parse(content)
  } catch {
    return []
  }

  const lines = content.split('\n')
  const checks: { name: string; currentVersion: string; section: string; lineNumber: number }[] = []

  for (const section of DEPENDENCY_SECTIONS) {
    const deps = pkg[section]
    if (!deps || typeof deps !== 'object') continue

    for (const [name, version] of Object.entries(deps)) {
      const versionStr = String(version ?? '')
      const pattern = new RegExp(
        `"${escapeRegex(name)}"\\s*:\\s*"${escapeRegex(versionStr)}"`,
      )
      const lineNumber = lines.findIndex((line) => pattern.test(line))

      checks.push({ name, currentVersion: versionStr, section, lineNumber })
    }
  }

  const fetchImpl = options?.fetchImpl ?? null

  const metadataResults = await Promise.all(
    checks.map(async (check) => {
      const meta = await fetchNpmMetadata(check.name)
      return { ...check, ...meta }
    }),
  )

  const packagesWithVersions = metadataResults
    .filter((pkg) => pkg.latest && pkg.versions?.length > 0)
    .map((pkg) => ({
      name: pkg.name,
      versions: pkg.versions.slice(0, 5),
    }))

  const vulnScores = {}
  for (const pkg of packagesWithVersions) {
    const scores = await queryVulnerabilityScores(
      pkg.name,
      pkg.versions,
      fetchImpl,
    )
    vulnScores[pkg.name] = scores
  }

  const results = metadataResults.map((pkg) => {
    const scores = vulnScores[pkg.name] ?? {}
    const currentScores = scores[pkg.currentVersion] ?? []
    const latestScores = pkg.latest ? (scores[pkg.latest] ?? []) : []

    const currentCvss = currentScores.length > 0 ? currentScores[0].score : null
    const latestCvss = latestScores.length > 0 ? latestScores[0].score : null

    return {
      name: pkg.name,
      currentVersion: pkg.currentVersion,
      section: pkg.section,
      lineNumber: pkg.lineNumber,
      latest: pkg.latest,
      deprecated: pkg.deprecated,
      deprecationMsg: pkg.deprecationMsg,
      versions: pkg.versions.slice(0, 5),
      cvssScore: currentCvss,
      latestCvss,
      vulnerabilities: currentScores,
      latestVulnerabilities: latestScores,
    }
  })

  return results
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
