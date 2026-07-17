# Versioning

## Engine API v1

- Export constant: `ENGINE_API_VERSION = "1"`
- Documented as Engine API v1

## Breaking Change Policy

A breaking change to the engine API is any change that:
- Removes or renames a public export
- Changes the shape of `ScanResult`, `Finding`, `ScanIssue`, or `Policy`
- Changes the semantics of `scan()`, `detect()`, or `applyPolicy()`
- Changes default behavior that hosts rely on

## Process

1. Bump `ENGINE_API_VERSION` to the next major (e.g., `"2"`).
2. Update `docs/core/api.md` and `docs/core/domain-model.md`.
3. Add migration notes in this file.
4. Update all hosts to use the new API version.
