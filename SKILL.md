# VulnLens — AI Security Analysis Skill

Use this skill when a user asks you to analyze, audit, or check their project's dependencies for vulnerabilities. VulnLens is an npm package that scans `package.json` dependencies against the OSV database and returns structured vulnerability data with CVSS scores.

## When to Use

- User asks: "check my dependencies for vulnerabilities"
- User asks: "audit my packages"
- User asks: "are there any security issues in my project"
- User asks: "scan my package.json"
- User wants to know CVE/CVSS scores for their dependencies
- User wants to know which dependencies are deprecated or outdated

## Quick Start

```bash
# Install VulnLens in the target project
npm install @vulnlens/engine

# Or use npx without installing
npx @vulnlens/engine scan ./package.json
```

## Programmatic Usage

### Scan for Vulnerabilities

```js
import { createEngine } from '@vulnlens/engine'

const engine = createEngine()

const result = await engine.scan({
  roots: ['/path/to/project'],
  policy: {
    minSeverity: 'low',       // 'low' | 'moderate' | 'high' | 'critical'
    allowNetwork: true,        // set false for offline scanning
  },
})

// result.status: 'ok' | 'degraded' | 'failed'
// result.findings: array of vulnerability findings
// result.stats: { findingCount, bySeverity, cacheHit }
```

### Check Dependency Health

```js
import { checkPackageHealth } from '@vulnlens/engine'

const health = await checkPackageHealth('/path/to/project/package.json')

health.forEach(pkg => {
  console.log(`${pkg.name}@${pkg.currentVersion}`)
  console.log(`  Latest: ${pkg.latest}`)
  console.log(`  CVSS: ${pkg.cvssScore ?? 'N/A'}`)
  console.log(`  Deprecated: ${pkg.deprecated}`)
  if (pkg.vulnerabilities.length > 0) {
    pkg.vulnerabilities.forEach(v => {
      console.log(`  ⚠ ${v.title} (CVSS ${v.score})`)
    })
  }
})
```

### Query Specific Package Versions

```js
import { fetchNpmMetadata, queryVulnerabilityScores } from '@vulnlens/engine'

// Get npm registry info
const meta = await fetchNpmMetadata('lodash')
console.log(`Latest: ${meta.latest}`)
console.log(`Deprecated: ${meta.deprecated}`)
console.log(`Versions: ${meta.versions.slice(0, 5).join(', ')}`)

// Get CVSS scores for specific versions
const scores = await queryVulnerabilityScores('lodash', ['4.17.15', '4.17.21'])
console.log(scores)
// { "4.17.15": [{ score: 7.5, severity: "high", title: "Prototype Pollution" }],
//   "4.17.21": [] }
```

## Reading the Results

### Finding Structure

Each finding in `result.findings` contains:

```js
{
  id: "uuid",
  vulnerability: {
    ids: [{ system: "cve", value: "CVE-2021-XXXXX" }],
    title: "Prototype Pollution in lodash",
    severity: "high",           // 'low' | 'moderate' | 'high' | 'critical'
    score: 7.5,                 // CVSS score (0-10), null if unknown
    summary: "Detailed description...",
    url: "https://github.com/advisories/...",
    fixedIn: ["4.17.21"],       // versions that fix the issue
  },
  occurrence: {
    package: { name: "lodash", version: "4.17.15", range: "^4.17.15" },
    manifestPath: "/path/to/package.json",
    manifestLocator: { line: 10, charStart: 5, charEnd: 20 },
  },
  scanner: "osv",
}
```

### Health Check Structure

Each item from `checkPackageHealth()`:

```js
{
  name: "lodash",
  currentVersion: "^4.17.15",
  section: "dependencies",
  lineNumber: 10,                // line in package.json (0-indexed)
  latest: "4.17.21",
  deprecated: false,
  deprecationMsg: null,
  versions: ["4.17.21", "4.17.20", ...],  // last 5 versions
  cvssScore: 7.5,                // score for installed version
  latestCvss: null,              // score for latest version
  vulnerabilities: [{ score: 7.5, severity: "high", title: "..." }],
  latestVulnerabilities: [],
}
```

### Severity Levels

| Level | CVSS Range | Meaning |
|-------|-----------|---------|
| `critical` | 9.0 - 10.0 | Immediate action required |
| `high` | 7.0 - 8.9 | Should fix soon |
| `moderate` | 4.0 - 6.9 | Plan to fix |
| `low` | 0.0 - 3.9 | informational |

## Complete Analysis Script

Here's a full script you can run to analyze any project:

```js
import { createEngine, checkPackageHealth } from '@vulnlens/engine'

async function analyzeProject(projectPath) {
  const engine = createEngine()

  // 1. Scan for vulnerabilities
  const scan = await engine.scan({
    roots: [projectPath],
    policy: { minSeverity: 'low', allowNetwork: true },
  })

  // 2. Check dependency health
  const health = await checkPackageHealth(`${projectPath}/package.json`)

  // 3. Build report
  const report = {
    summary: {
      totalDependencies: health.length,
      vulnerable: scan.stats.findingCount,
      bySeverity: scan.stats.bySeverity,
      deprecated: health.filter(h => h.deprecated).length,
      outdated: health.filter(h => h.latest && h.currentVersion.replace(/^[^~>=<]*/, '') !== h.latest).length,
    },
    vulnerabilities: scan.findings.map(f => ({
      package: f.occurrence.package.name,
      installed: f.occurrence.package.version,
      severity: f.vulnerability.severity,
      cvss: f.vulnerability.score,
      title: f.vulnerability.title,
      fix: f.vulnerability.fixedIn?.[0] ?? null,
      advisory: f.vulnerability.url,
    })),
    health: health.map(h => ({
      package: h.name,
      installed: h.currentVersion,
      latest: h.latest,
      cvss: h.cvssScore,
      deprecated: h.deprecated,
      deprecationMsg: h.deprecationMsg,
    })),
  }

  return report
}

// Usage
const report = await analyzeProject('/path/to/user/project')
console.log(JSON.stringify(report, null, 2))
```

## CLI Usage

```bash
# Scan a project
npx @vulnlens/engine scan /path/to/project

# Scan with minimum severity filter
npx @vulnlens/engine scan /path/to/project --min-severity high

# Offline scan (no network)
npx @vulnlens/engine scan /path/to/project --no-network

# Check health of specific package.json
npx @vulnlens/engine health /path/to/package.json
```

## Tips for AI Agents

1. **Always use `allowNetwork: true`** unless the user specifically wants offline scanning
2. **Filter by severity** based on context — for production apps, focus on `high` and `critical`
3. **Check `fixedIn`** to suggest specific upgrade versions
4. **Use `checkPackageHealth()`** for a quick overview before doing a full scan
5. **The `lineNumber`** in health results maps to the line in `package.json` — useful for showing users exactly where issues are
6. **Results are cached** — calling `checkPackageHealth()` multiple times is fast
7. **`cvssScore: null`** means the score is unknown — don't assume it's safe

## Error Handling

```js
try {
  const result = await engine.scan({ roots: ['./'] })
  if (result.status === 'degraded') {
    console.warn('Scan completed with issues:', result.issues)
  }
} catch (error) {
  // Only throws for programmer errors (invalid input)
  // Network failures become status: 'degraded' with issues array
}
```

## Package Info

- **Package**: `@vulnlens/engine`
- **Version**: 0.1.0
- **Engine API**: v1
- **Requires**: Node.js 20+
- **License**: MIT
