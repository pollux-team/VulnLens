# ADR-007: TypeScript Core

## Context

The engine needs to be fast, maintainable, and compatible with the VS Code extension host (Node.js). A native binary (Rust) would add build complexity and FFI overhead.

## Decision

The engine is written in TypeScript (strict mode) running in-process in the Node.js extension host. Rust or other native code is not used in v1. The engine MAY be rewritten in Rust later if performance demands it, but the public API surface remains the same.

## Consequences

- **Positive**: Simple build, no FFI, easy debugging, consistent with VS Code extension ecosystem.
- **Negative**: Single-threaded; CPU-bound work blocks the extension host.
- **Mitigation**: Scans are async with cancellation support; large workspaces use debouncing and budgets.
