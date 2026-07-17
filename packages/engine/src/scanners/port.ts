import { DEFAULT_POLICY, emptyFindings, emptyIssues } from '../schemas.js'

/**
 * @param {{
 *   root?: string,
 *   manifests?: string[],
 *   lockfiles?: string[],
 *   policy?: typeof DEFAULT_POLICY,
 *   signal?: AbortSignal | null,
 *   runCommand?: unknown,
 *   fetchImpl?: typeof fetch | null,
 * }} parts
 */
export function createScannerContext(parts) {
  const policy = parts.policy ?? DEFAULT_POLICY
  const fetchImpl =
    parts.fetchImpl ??
    (typeof globalThis.fetch === 'function'
      ? globalThis.fetch.bind(globalThis)
      : null)

  return {
    root: parts.root ?? '',
    manifests: parts.manifests ?? [],
    lockfiles: parts.lockfiles ?? [],
    policy,
    signal: parts.signal ?? null,
    runCommand: parts.runCommand ?? null,
    fetchImpl,
  }
}

/**
 * @param {string} [scannerId]
 */
export function emptyScannerResult(scannerId) {
  return {
    findings: emptyFindings(),
    issues: emptyIssues(),
    scannersUsed: scannerId ? [scannerId] : [],
  }
}

/**
 * @param {string} code
 * @param {string} message
 * @param {{ path?: string | null, ecosystem?: string | null, retriable?: boolean }} [extras]
 */
export function makeScanIssue(code, message, extras) {
  const extra = extras ?? {}
  return {
    code,
    message,
    path: extra.path ?? null,
    ecosystem: extra.ecosystem ?? null,
    retriable: extra.retriable ?? false,
  }
}
