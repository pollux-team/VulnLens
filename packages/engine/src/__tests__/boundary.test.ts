import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('Package boundary enforcement', () => {
  it('engine source has no vscode import', async () => {
    const srcDir = join(import.meta.dirname, '..')
    const files = await readdir(srcDir, { recursive: true })

    const sourceFiles = files.filter(
      (file) =>
        (file.endsWith('.ts') || file.endsWith('.js')) &&
        !file.endsWith('.test.ts') &&
        !file.includes('__tests__') &&
        !file.includes('forbidden-vscode'),
    )

    expect(sourceFiles.length).toBeGreaterThan(0)

    for (const file of sourceFiles) {
      const content = await readFile(join(srcDir, file), 'utf-8')
      const hasVscodeImport =
        content.includes("from 'vscode'") ||
        content.includes('from "vscode"') ||
        content.includes("require('vscode')") ||
        content.includes('require("vscode")')
      expect(hasVscodeImport, `Found vscode import in ${file}`).toBe(false)
    }
  })
})
