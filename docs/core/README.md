# Core Docs

Core docs define the **stable contract** of `@vulnlens/engine`: domain model, public API, scanner port, policy, cache, errors, and report shapes. Host adapters (VS Code, CLI) must depend only on this contract. When code and docs disagree, **fix code or docs in the same change** — do not leave drift.

## Maintenance Rules

1. Any change to public engine types or functions → update the affected `docs/core/*` file(s) in the same change.
2. Any new scanner → update `docs/core/scanners.md` + glossary ecosystem list.
3. Any new error/degraded mode → update `docs/core/errors.md`.
4. OpenSpec change that alters behavior → link to the core doc section it affects.
5. Version the contract: bump documented API version when breaking `ScanResult` / `scan()` semantics.
6. AI/human implementers read `docs/core/api.md` + `domain-model.md` before coding engine features.

## Files

- [overview.md](overview.md) — Engine responsibilities & non-responsibilities
- [domain-model.md](domain-model.md) — All types, enums, invariants
- [api.md](api.md) — Public engine API surface
- [scanners.md](scanners.md) — Scanner port & adapter rules
- [policy.md](policy.md) — Severity, ignores, config mapping
- [cache.md](cache.md) — Key algorithm, TTL, CacheStore port
- [errors.md](errors.md) — Stable ScanIssue codes + degraded vs failed
- [versioning.md](versioning.md) — API version policy & breaking change process
