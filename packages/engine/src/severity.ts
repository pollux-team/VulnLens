/**
 * @param {string} severity
 */
export function normalizeSeverity(severity) {
  if (severity === 'medium') return 'moderate'
  if (
    severity === 'low' ||
    severity === 'moderate' ||
    severity === 'high' ||
    severity === 'critical'
  ) {
    return severity
  }
  return 'moderate'
}

/**
 * @param {string} severity
 */
export function getSeverityRank(severity) {
  const normalized = normalizeSeverity(severity)
  if (normalized === 'low') return 0
  if (normalized === 'moderate') return 1
  if (normalized === 'high') return 2
  if (normalized === 'critical') return 3
  return -1
}
