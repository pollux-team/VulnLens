import { describe, expect, it, vi } from 'vitest'

// Minimal vscode mock for unit tests outside the extension host
vi.mock('vscode', () => {
  class Range {
    constructor(startLine, startChar, endLine, endChar) {
      this.start = { line: startLine, character: startChar }
      this.end = { line: endLine, character: endChar }
    }
  }

  const DiagnosticSeverity = {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  }

  class Diagnostic {
    constructor(range, message, severity) {
      this.range = range
      this.message = message
      this.severity = severity
      this.source = undefined
      this.code = undefined
    }
  }

  return {
    Range,
    Diagnostic,
    DiagnosticSeverity,
  }
})

const { occurrenceToRange, findingToDiagnostic } = await import('./range.js')

describe('occurrenceToRange', () => {
  it('maps locator to range', () => {
    const range = occurrenceToRange({
      manifestLocator: {
        packageName: 'lodash',
        section: 'dependencies',
        line: 4,
        charStart: 14,
        charEnd: 23,
      },
    })

    expect(range).not.toBeNull()
    expect(range.start.line).toBe(4)
    expect(range.start.character).toBe(14)
    expect(range.end.character).toBe(23)
  })

  it('returns null without locator', () => {
    expect(occurrenceToRange({})).toBeNull()
    expect(occurrenceToRange(null)).toBeNull()
  })
})

describe('findingToDiagnostic', () => {
  it('creates one diagnostic per finding with matching range', () => {
    const finding = {
      id: 'f1',
      vulnerability: {
        title: 'Prototype Pollution',
        severity: 'high',
      },
      occurrence: {
        manifestPath: '/tmp/package.json',
        manifestLocator: {
          packageName: 'lodash',
          section: 'dependencies',
          line: 5,
          charStart: 10,
          charEnd: 18,
        },
      },
    }

    const diagnostic = findingToDiagnostic(finding)
    expect(diagnostic).not.toBeNull()
    expect(diagnostic.message).toContain('Prototype Pollution')
    expect(diagnostic.range.start.line).toBe(5)
    expect(diagnostic.source).toBe('VulnLens')
    expect(diagnostic.code).toBe('f1')
  })
})
