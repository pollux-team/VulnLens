import { describe, expect, it } from 'vitest'

import { applyPolicy } from './policy.js'

function finding(id, severity) {
  return {
    id,
    vulnerability: { severity },
  }
}

describe('applyPolicy', () => {
  const findings = [
    finding('1', 'low'),
    finding('2', 'moderate'),
    finding('3', 'high'),
    finding('4', 'critical'),
  ]

  it('filters by minSeverity moderate', () => {
    const result = applyPolicy(findings, { minSeverity: 'moderate' })
    expect(result.map((f) => f.id)).toEqual(['2', '3', '4'])
  })

  it('filters by minSeverity high', () => {
    const result = applyPolicy(findings, { minSeverity: 'high' })
    expect(result.map((f) => f.id)).toEqual(['3', '4'])
  })

  it('keeps all when minSeverity is low', () => {
    const result = applyPolicy(findings, { minSeverity: 'low' })
    expect(result).toHaveLength(4)
  })

  it('returns empty when nothing meets critical', () => {
    const result = applyPolicy(findings.slice(0, 3), { minSeverity: 'critical' })
    expect(result).toHaveLength(0)
  })
})
