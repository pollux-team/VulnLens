## Why

Zed is gaining popularity as a fast, modern code editor, but it lacks built-in dependency vulnerability scanning. Developers using Zed have no way to see CVE scores, deprecated packages, or available upgrades inline. The VulnLens engine already provides this data — extending it to Zed brings the same security visibility to a new audience.

## What Changes

- Add `packages/zed/` — a Zed extension written in Rust (compiled to WASM)
- Add `packages/zed-cli/` — a Node.js CLI sidecar that wraps `@vulnlens/engine`
- The Zed extension spawns the CLI, reads JSON output, and shows diagnostics
- Slash command `/vulnens-scan` for the Zed AI Assistant
- Inline diagnostic annotations on vulnerable dependency lines in `package.json`

## Capabilities

### New Capabilities
- `zed-host`: Zed extension (Rust/WASM) — spawns CLI sidecar, parses results, shows diagnostics, provides slash command
- `zed-cli`: Node.js CLI wrapper — accepts `scan` and `health` commands, outputs JSON, reuses `@vulnlens/engine` directly

### Modified Capabilities
- None — this is a new host adapter, same pattern as `vscode-host`

## Impact

- **New code**: `packages/zed/` (Rust extension), `packages/zed-cli/` (Node.js CLI)
- **New dependencies**: `zed_extension_api` (Rust crate), `clap` (CLI args)
- **Reuses**: `@vulnlens/engine` via the CLI sidecar
- **Public API**: No engine changes needed — CLI uses existing `createEngine`, `checkPackageHealth`
- **Build**: Rust toolchain + WASM target for extension; Node.js for CLI
