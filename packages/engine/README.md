# @vulnlens/engine

Host-agnostic dependency vulnerability scanning engine for Node.js.

Scans `package.json` dependencies against the [OSV](https://osv.dev/) database and returns structured vulnerability data with CVSS scores.

## Install

```bash
npm install @vulnlens/engine
```

## Quick Start

```js
import { createEngine, checkPackageHealth } from '@vulnlens/engine'

// Scan for vulnerabilities
const engine = createEngine()
const result = await engine.scan({
  roots: ['./'],
  policy: { minSeverity: 'low', allowNetwork: true },
})

console.log(`Found ${result.stats.findingCount} vulnerabilities`)

// Check dependency health
const health = await checkPackageHealth('./package.json')
health.forEach(pkg => {
  console.log(`${pkg.name}: CVSS ${pkg.cvssScore ?? 'N/A'}`)
})
```

## API

### `createEngine(options?)`

Create a scan engine instance.

```js
const engine = createEngine({
  fetchImpl: myFetch,    // custom fetch implementation
  cache: myCache,        // custom cache store
  scanners: [myScanner], // custom scanners
})
```

### `engine.scan(request)`

Scan for vulnerabilities.

```js
const result = await engine.scan({
  roots: ['/path/to/project'],
  policy: {
    minSeverity: 'moderate',  // 'low' | 'moderate' | 'high' | 'critical'
    allowNetwork: true,
  },
})
// result.findings: Finding[]
// result.stats: { findingCount, bySeverity, cacheHit }
// result.status: 'ok' | 'degraded' | 'failed'
```

### `checkPackageHealth(manifestPath)`

Get health status for all dependencies in a package.json.

```js
const health = await checkPackageHealth('./package.json')
// [{ name, currentVersion, latest, cvssScore, deprecated, versions, ... }]
```

### `fetchNpmMetadata(name)`

Query npm registry for package metadata.

```js
const meta = await fetchNpmMetadata('lodash')
// { latest, deprecated, deprecationMsg, versions }
```

### `queryVulnerabilityScores(name, versions)`

Query OSV for CVSS scores across versions.

```js
const scores = await queryVulnerabilityScores('lodash', ['4.17.15', '4.17.21'])
// { "4.17.15": [{ score: 7.5, severity: "high", title: "..." }], ... }
```

## License

MIT
