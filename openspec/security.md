# VulnLens — Security

## Threat Model

VulnLens processes untrusted data (manifest files, lockfiles, vulnerability APIs) in the developer's workspace. The engine must never mutate user files or execute arbitrary commands.

## MUST List

1. **No manifest mutation** — Engine never writes to `package.json`, lockfiles, or any user file. Annotations are rendered via editor surfaces only.
2. **No install execution** — Engine never runs `npm install`, `yarn add`, or any package manager command.
3. **Allowlisted tools only** — If spawning external tools (npm audit), only pre-approved binaries. Shell is never used.
4. **Workspace trust** — Auto-scan and network requests are suppressed in untrusted workspaces.
5. **No secrets in logs** — Engine never logs API keys, tokens, or file contents containing secrets.
6. **Network gate** — OSV requests require `allowNetwork: true` in policy. Local-only mode available.
7. **Timeout enforcement** — All network calls and tool executions have configurable timeouts.
8. **Error isolation** — Scanner failures degrade gracefully (partial findings + issues), never crash the host.
