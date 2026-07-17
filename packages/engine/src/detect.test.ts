import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { detect, hashFile } from './detect.js'

describe('detect', () => {
  it('finds package.json and lockfiles', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vulnlens-detect-'))
    await writeFile(join(root, 'package.json'), '{"name":"x"}')
    await writeFile(join(root, 'package-lock.json'), '{}')

    const result = await detect([root])
    expect(result.packages).toHaveLength(1)
    expect(result.packages[0].ecosystems).toContain('npm')
    expect(result.packages[0].manifests.some((p) => p.endsWith('package.json'))).toBe(
      true,
    )
    expect(
      result.packages[0].lockfiles.some((p) => p.endsWith('package-lock.json')),
    ).toBe(true)
  })

  it('returns empty packages for empty roots', async () => {
    const result = await detect([])
    expect(result.packages).toEqual([])
  })
})

describe('hashFile', () => {
  it('returns stable sha256 for content', async () => {
    const root = await mkdtemp(join(tmpdir(), 'vulnlens-hash-'))
    const path = join(root, 'package.json')
    await writeFile(path, '{"name":"stable"}')
    const a = await hashFile(path)
    const b = await hashFile(path)
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
  })

  it('returns empty string for missing file', async () => {
    expect(await hashFile('/tmp/does-not-exist-vulnlens-xyz')).toBe('')
  })
})
