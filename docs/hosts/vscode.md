# VS Code Host

## Allowed

- Call `createEngine` / `scan`
- Map `Finding.occurrence` → editor ranges
- Render Diagnostics, CodeLens, Hover, Tree, Webview, StatusBar
- Provide virtual annotated document (read-only)
- Pass `CancellationToken` → `AbortSignal`
- Read VS Code config → build `Policy`
- Persist ignores via settings/state → pass into Policy

## Forbidden

- Parse npm audit JSON in the extension layer
- Re-implement severity ranking differently from engine
- Write vulnerability comments into on-disk `package.json`
- Run `npm install` without explicit user command

## Commands

- `vulnlens.scan` — Scan workspace / current package
- `vulnlens.clearCache` — Clear engine cache

## Configuration Keys (prefix `vulnlens.`)

- `minSeverity` — Minimum severity to display (default: `moderate`)
- `autoScanOnOpen` — Auto-scan on file open (default: `true`)
- `allowNetwork` — Allow OSV API requests (default: `true`)
