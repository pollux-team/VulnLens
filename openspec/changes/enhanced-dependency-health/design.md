## Context

VulnLens currently shows inline dependency health status (✓ latest, ↗ version available, ⚠ deprecated) as text decorations at the end of each line in `package.json`. The data comes from querying the npm registry for each package. However, there's no vulnerability context shown inline, and no way to see version history or CVSS scores without leaving the editor.

The existing `dependency-health.ts` fetches basic npm info (latest version, deprecated status). The OSV scanner in the engine already queries vulnerability data but only for direct dependencies during a full scan. There's an opportunity to combine these data sources for a richer inline experience.

## Goals / Non-Goals

**Goals:**
- Show CVSS vulnerability scores inline next to each dependency
- Provide a clickable popover with version history, CVSS scores per version, and fix recommendations
- Keep the engine core host-agnostic so CLI/CI can reuse the health advisor
- Cache npm registry responses to avoid redundant API calls
- Maintain fast inline decoration rendering (<100ms perceived)

**Non-Goals:**
- Automatic version upgrades (user must confirm)
- Lockfile-aware version resolution (deferred to v2)
- Support for non-npm registries (PyPI, Go) in this change
- Real-time watch mode for package.json changes

## Decisions

**D1 — Engine-core health advisor.** Move npm registry queries and version history logic into `packages/engine/src/health/` as a reusable module. *Why:* keeps the VS Code extension thin (presentation only) and allows CLI/CI to use the same logic. *Alternative:* keep logic in vscode package — rejected (duplicates effort for future hosts).

**D2 — Separate registry and vulnerability queries.** Registry queries (version history, deprecated status) are separate from OSV vulnerability queries. The health advisor composes both. *Why:* registry API is fast and cached; OSV queries are slower and should be batched. Separation allows independent caching and failure handling.

**D3 — In-memory LRU cache with 5-minute TTL.** Cache npm registry responses keyed by package name. *Why:* package versions don't change frequently; avoids hitting registry on every editor open. *Alternative:* no cache — rejected (too many API calls). Disk persistence — overkill for MVP.

**D4 — Webview popover for version details.** Use a VS Code webview panel (like the existing finding panel) for the version history modal. *Why:* rich HTML/CSS rendering with colored CVSS badges, clickable version list, and fix recommendations. *Alternative:* QuickPick — too limited for the desired layout.

**D5 — Inline decorations positioned at line end.** Keep the existing decoration approach (text at end of line) but add CVSS score. Format: `// ✓ latest` or `// ↗ 3.5.0 CVSS 7.5` or `// ⚠ deprecated`. *Why:* non-intrusive, doesn't shift code, matches existing UX pattern.

**D6 — Batch OSV queries for vulnerability scores.** When showing version history, query OSV for all displayed versions in a single batch request. *Why:* reduces network round-trips; OSV supports batch endpoint `/v1/querybatch`.

## Risks / Trade-offs

- **npm registry rate limiting** → Mitigation: in-memory cache with TTL; batch requests where possible; graceful degradation (show "—" if query fails)
- **OSV batch queries may be slow for many versions** → Mitigation: limit popover to last 5 versions; show scores progressively as they load
- **Popover may feel heavy for quick checks** → Mitigation: keep inline decorations as the primary info source; popover is optional detail on click
- **Engine core gains npm-specific logic** → Mitigation: isolate in `health/` subdirectory; registry abstraction allows swapping to other registries later

## Migration Plan

Greenfield addition — no migration needed. The existing inline decorations continue to work; this change enhances them with CVSS data and adds the popover.

## Open Questions

- Should the popover show all available versions or just the last N? *Lean:* last 5 to keep it compact.
- Should CVSS scores show in the inline decoration at all times, or only on hover? *Lean:* always show if available, show "—" if unknown.
