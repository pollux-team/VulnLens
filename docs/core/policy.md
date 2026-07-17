# Policy

## Settings

### minSeverity

Type: `Severity`. Default: `moderate`.

Findings below this threshold are dropped by the policy layer before reaching hosts.

### allowNetwork

Type: `boolean`. Default: `true`.

When `false`, OSV adapter skips all network calls and emits `NETWORK_DISABLED` issue. Engine operates in local-only mode.

### directOnly

Type: `boolean`. Default: `false`. **Deferred** — not implemented in MVP.

When `true`, only `occurrence.kind === direct` findings are shown.

### enabledEcosystems

Type: `Ecosystem[] | "all"`. Default: `"all"`. **Deferred** — not implemented in MVP.

### ignores

Type: `IgnoreRule[]`. **Deferred** — not implemented in MVP.

Match advisory id and/or package (+ecosystem); honor `expiresAt`.

## Host Mapping

VS Code settings → `Policy` object. The mapping lives in `packages/vscode`, not in the engine. The engine receives an already-constructed `Policy`.
