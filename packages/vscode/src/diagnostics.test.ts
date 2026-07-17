import { describe, expect, it, vi } from 'vitest'

vi.mock('vscode', () => {
  class Range {
    constructor(startLine, startChar, endLine, endChar) {
      this.start = { line: startLine, character: startChar }
      this.end = { line: endLine, character: endChar }
    }
  }

  class Uri {
    static file(path) {
      return { fsPath: path, path }
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
    }
  }

  return { Range, Uri, Diagnostic, DiagnosticSeverity }
})

const { applyDiagnostics } = await import('./diagnostics.js')

function makeFinding(id, path) {
  return {
    id,
    vulnerability: { title: `Vuln ${id}`, severity: 'high' },
    occurrence: {
      manifestPath: path,
      manifestLocator: {
        packageName: 'pkg',
        section: 'dependencies',
        line: 1,
        charStart: 2,
        charEnd: 5,
      },
    },
  }
}

describe('applyDiagnostics', () => {
  it('sets one diagnostic per finding', () => {
    const setCalls = []
    const collection = {
      clear: vi.fn(),
      set: (uri, diags) => {
        setCalls.push({ uri, diags })
      },
    }

    const findings = [
      makeFinding('a', '/tmp/package.json'),
      makeFinding('b', '/tmp/package.json'),
    ]

    applyDiagnostics(collection, {
      findings,
      stats: { findingCount: 2 },
    })

    expect(collection.clear).toHaveBeenCalled()
    expect(setCalls).toHaveLength(1)
    expect(setCalls[0].diags).toHaveLength(2)
  })

  it('clears diagnostics when zero findings', () => {
    const collection = {
      clear: vi.fn(),
      set: vi.fn(),
    }

    applyDiagnostics(collection, {
      findings: [],
      stats: { findingCount: 0 },
    })

    expect(collection.clear).toHaveBeenCalled()
    expect(collection.set).not.toHaveBeenCalled()
  })
})
