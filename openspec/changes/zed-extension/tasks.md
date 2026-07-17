## 1. CLI Sidecar (`packages/zed-cli/`)

- [x] 1.1 Create `packages/zed-cli/` with `package.json`, `tsconfig.json`
- [x] 1.2 Implement `cli.ts` with `scan` command using `createEngine()`
- [x] 1.3 Implement `health` command using `checkPackageHealth()`
- [x] 1.4 Add `--min-severity` and `--no-network` flags
- [x] 1.5 Output structured JSON to stdout, errors to stderr
- [x] 1.6 Add `bin` entry to package.json for `vulnens-cli` command
- [x] 1.7 Write tests for CLI commands

## 2. Zed Extension (`packages/zed/`)

- [x] 2.1 Create `packages/zed/` with `Cargo.toml`, `extension.toml`
- [x] 2.2 Implement `src/lib.rs` with `Extension` trait
- [x] 2.3 Implement `scan` method — spawn CLI, parse JSON, return diagnostics
- [x] 2.4 Map CVSS severity to Zed diagnostic severity levels
- [x] 2.5 Register `/vulnens-scan` slash command for AI Assistant
- [x] 2.6 Implement slash command to return markdown summary
- [x] 2.7 Add "VulnLens: Scan Workspace" command
- [x] 2.8 Handle CLI not found with helpful error message

## 3. Build & Distribution

- [x] 3.1 Add `build` script to compile Rust to WASM (`wasm32-wasip1`)
- [x] 3.2 Bundle CLI script with extension for single-install
- [x] 3.3 Add `extension.toml` metadata (name, version, authors)
- [ ] 3.4 Test extension in Zed dev mode

## 4. Testing & Docs

- [x] 4.1 Write unit tests for CLI
- [x] 4.2 Write integration test for extension + CLI
- [x] 4.3 Update root `pnpm-workspace.yaml` to include `zed-cli`
- [ ] 4.4 Update `SKILL.md` with Zed extension usage
- [x] 4.5 Verify `pnpm typecheck` and `pnpm test` pass
