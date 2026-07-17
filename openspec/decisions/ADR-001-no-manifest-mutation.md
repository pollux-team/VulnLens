# ADR-001: No Manifest Mutation

## Context

VulnLens surfaces vulnerability information in the editor. The question is whether annotations should be written into the actual `package.json` files on disk (e.g., adding `// CVE-2021-23337` comments) or rendered only through editor surfaces.

## Decision

VulnLens SHALL NEVER mutate user manifests or lockfiles. All annotations are rendered via editor surfaces (Diagnostics, decorations, virtual documents) only. The engine and host adapters are forbidden from writing to user files.

## Consequences

- **Positive**: Users' files remain untouched; no git diffs from scanning; no risk of breaking build tools that parse `package.json` strictly.
- **Negative**: Annotations disappear when the extension is disabled; no persistent record of findings in the file itself.
- **Mitigation**: The engine provides `ScanResult` which hosts can persist in their own storage (e.g., VS Code `workspaceState`).
