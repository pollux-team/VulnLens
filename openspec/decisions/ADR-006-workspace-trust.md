# ADR-006: Workspace Trust

## Context

VS Code workspaces can be untrusted (e.g., opening a cloned repo). Running scans or making network requests in untrusted workspaces could be a security risk.

## Decision

The VS Code adapter SHALL NOT auto-scan in untrusted workspaces. Network requests (OSV API) are suppressed. Manual `vulnlens.scan` is also refused unless the workspace is trusted. The engine itself is host-agnostic; the trust gate lives in the host adapter.

## Consequences

- **Positive**: Prevents scanning untrusted code or making network requests from untrusted contexts.
- **Negative**: Users must explicitly trust a workspace before seeing vulnerability data.
- **Mitigation**: The trust gate is a well-understood VS Code concept; users are familiar with the pattern.
