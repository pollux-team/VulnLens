# Scanner Port

## Interface

```typescript
Scanner {
  id: string (stable, e.g. "npm-manifest", "osv")
  supports(detection: PackageDetection): boolean
  scan(ctx: ScannerContext): Promise<ScannerRawResult>
}
```

**ScannerContext:**
- `root`, `manifests`, `lockfiles`, `policy`, `signal`, `runCommand`, `fetchImpl`

**ScannerRawResult:**
- `findings: Finding[]` (already in domain shape)
- `issues: ScanIssue[]`
- `scannersUsed: string[]`

## Adapter Rules

1. Translate external formats → domain `Finding` inside the adapter.
2. Do NOT apply global minSeverity/ignores — only orchestrator applies policy.
3. Time out and fail soft → `issues`, not uncaught exceptions.
4. Allowlisted tools only (if spawning processes).
5. Prefer lockfile resolved versions.

## Built-in Scanners (Roadmap)

| ID | Phase | Input | Notes |
|----|-------|-------|-------|
| `npm-manifest` | 1 | package.json | AST parser with location data |
| `osv` | 1 | any manifest | Universal fallback via api.osv.dev |
| `yarn-audit` / lock+osv | 5 | yarn.lock | |
| `pnpm-audit` / lock+osv | 5 | pnpm-lock | |
| `pypi` | 5 | requirements/poetry | |
