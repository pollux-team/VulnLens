import { mutableList } from './schemas.js'
import { getSeverityRank } from './severity.js'

/**
 * @param {Array<{ vulnerability: { severity: string } }>} findings
 * @param {{ minSeverity: string }} policy
 */
export function applyPolicy(findings, policy) {
  const minRank = getSeverityRank(policy.minSeverity)
  const kept = mutableList()

  for (const finding of findings) {
    const rank = getSeverityRank(finding.vulnerability.severity)
    if (rank >= minRank) {
      kept.push(finding)
    }
  }

  return kept
}
