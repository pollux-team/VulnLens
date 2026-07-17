export function updateStatusBar(statusBarItem, result) {
  if (!statusBarItem || !result) {
    return
  }

  const { bySeverity, findingCount } = result.stats
  const parts: string[] = []

  if (bySeverity.critical > 0) parts.push(`${bySeverity.critical} critical`)
  if (bySeverity.high > 0) parts.push(`${bySeverity.high} high`)
  if (bySeverity.moderate > 0) parts.push(`${bySeverity.moderate} moderate`)
  if (bySeverity.low > 0) parts.push(`${bySeverity.low} low`)

  if (findingCount === 0) {
    statusBarItem.text = '$(check) VulnLens: No issues'
    statusBarItem.tooltip = 'VulnLens: No vulnerabilities found'
  } else {
    statusBarItem.text = `$(warning) VulnLens: ${parts.join(', ')}`
    statusBarItem.tooltip = `VulnLens: ${findingCount} findings`
  }

  if (result.status === 'degraded') {
    statusBarItem.text += ' (degraded)'
  } else if (result.status === 'failed') {
    statusBarItem.text += ' (failed)'
  }

  const hostIssue = result.issues?.find((i) => i.code === 'WORKSPACE_UNTRUSTED')
  if (hostIssue) {
    statusBarItem.text = '$(shield) VulnLens: Untrusted workspace'
    statusBarItem.tooltip = hostIssue.message
  }
}
