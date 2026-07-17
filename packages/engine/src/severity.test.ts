import { describe, expect, it } from 'vitest'

import { getSeverityRank, normalizeSeverity } from './severity.js'

describe('normalizeSeverity', () => {
  it('maps medium to moderate', () => {
    expect(normalizeSeverity('medium')).toBe('moderate')
  })

  it('passes through known severities', () => {
    expect(normalizeSeverity('low')).toBe('low')
    expect(normalizeSeverity('moderate')).toBe('moderate')
    expect(normalizeSeverity('high')).toBe('high')
    expect(normalizeSeverity('critical')).toBe('critical')
  })

  it('defaults unknown values to moderate', () => {
    expect(normalizeSeverity('unknown')).toBe('moderate')
  })
})

describe('getSeverityRank', () => {
  it('returns ordered ranks', () => {
    expect(getSeverityRank('low')).toBe(0)
    expect(getSeverityRank('moderate')).toBe(1)
    expect(getSeverityRank('high')).toBe(2)
    expect(getSeverityRank('critical')).toBe(3)
  })

  it('orders severities correctly', () => {
    expect(getSeverityRank('low')).toBeLessThan(getSeverityRank('moderate'))
    expect(getSeverityRank('moderate')).toBeLessThan(getSeverityRank('high'))
    expect(getSeverityRank('high')).toBeLessThan(getSeverityRank('critical'))
  })

  it('normalizes medium before ranking', () => {
    expect(getSeverityRank('medium')).toBe(getSeverityRank('moderate'))
  })
})
