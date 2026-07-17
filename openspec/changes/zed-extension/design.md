## Context

Zed extensions are Rust programs compiled to WebAssembly. They run in a sandboxed environment and cannot directly import Node.js modules. The VulnLens engine is written in TypeScript and requires Node.js.

The solution is a **sidecar pattern**: a small Node.js CLI that wraps the engine, and a Zed extension that spawns it. The extension communicates with the CLI via stdout/stderr JSON, making it agnostic to the engine's implementation language.

## Goals / Non-Goals

**Goals:**
- Show vulnerability diagnostics in Zed's Problems panel for `package.json`
- Provide `/vulnens-scan` slash command for the AI Assistant
- Reuse `@vulnlens/engine` via CLI sidecar (no Rust rewrite)
- Support the same features as VS Code: CVSS scores, severity filtering, deprecated warnings

**Non-Goals:**
- Inline CodeLens/decorations (Zed doesn't support this yet)
- Version picker UI (deferred to future Zed API additions)
- Real-time auto-scan on file open (scan on command only for MVP)

## Decisions

**D1 — CLI sidecar over Rust rewrite.** The CLI (`packages/zed-cli/`) wraps the existing engine in a thin Node.js binary. *Why:* reuses 100% of the engine code, no Rust rewrite needed, same behavior as VS Code. *Alternative:* rewrite engine in Rust — rejected (massive effort, duplicated logic).

**D2 — JSON protocol over stdout.** The CLI outputs structured JSON on stdout; the extension parses it. *Why:* simple, no IPC needed, works in WASM sandbox. *Alternative:* HTTP server — rejected (port conflicts, sandbox restrictions).

**D3 — `zed_extension_api` crate for the extension.** Use the official Zed Extension API (v0.7.0) compiled to `wasm32-wasip1`. *Why:* official API, WASM sandbox, access to worktree, process spawning, and diagnostics.

**D4 — Slash command for AI Assistant integration.** Register `/vulnens-scan` slash command that runs the scan and returns results as context for the AI. *Why:* leverages Zed's AI features, provides natural language vulnerability summaries.

**D5 — Bundle CLI with extension.** The CLI Node.js script is bundled into the extension's WASM binary or shipped as a sidecar file. *Why:* single install, no separate `npm install` step for users.

## Risks / Trade-offs

- **Node.js dependency** → Users must have Node.js installed (20+). Mitigated by clear error message if node not found.
- **WASM sandbox limitations** → Cannot directly call Node.js APIs from WASM. Mitigated by sidecar pattern (spawn process, read stdout).
- **CLI startup latency** → Node.js cold start adds ~200ms. Mitigated by caching results and running scan only on command.
- **Zed API instability** → Zed extension API is still evolving. Mitigated by pinning to specific `zed_extension_api` version.

## Migration Plan

Greenfield addition — no migration. The CLI sidecar is a new package; the Zed extension is a new package.

## Open Questions

- Should the CLI be a separate npm package or bundled inside the extension? *Lean:* separate package for reuse, but bundle a copy for Zed distribution.
- Should the slash command return raw JSON or a formatted markdown summary? *Lean:* markdown for AI readability.
