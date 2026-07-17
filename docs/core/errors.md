# Error Codes

## Stable ScanIssue Codes

| Code | Meaning |
|------|---------|
| `TOOL_NOT_FOUND` | npm/pnpm/etc. missing |
| `LOCKFILE_MISSING` | cannot resolve versions reliably |
| `AUDIT_FAILED` | tool exited unexpectedly / invalid output |
| `PARSE_FAILED` | lock/manifest/audit JSON invalid |
| `NETWORK_DISABLED` | policy forbids network |
| `NETWORK_FAILED` | OSV/HTTP failure |
| `TIMEOUT` | scanner exceeded timeout |
| `CANCELLED` | user/host aborted |
| `UNSUPPORTED_ECOSYSTEM` | detected but no adapter |
| `WORKSPACE_UNTRUSTED` | host refused scan (host-only) |
| `INTERNAL` | bug; log details |

## Degraded vs Failed

- **Degraded** (`status: "degraded"`): Partial findings available plus one or more issues. Some scanners failed but others succeeded.
- **Failed** (`status: "failed"`): No reliable findings. All scanners failed or the request was invalid.
