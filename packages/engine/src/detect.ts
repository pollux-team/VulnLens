import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { mutableList } from './schemas.js'

/**
 * @param {string[]} [roots]
 */
export async function detect(roots) {
  const rootList = roots ?? []
  const packages = mutableList()

  for (const root of rootList) {
    const ecosystems = mutableList()
    const manifests = mutableList()
    const lockfiles = mutableList()

    try {
      const entries = await readdir(root)

      for (const entry of entries) {
        const entryPath = join(root, entry)
        const fileStat = await stat(entryPath).catch(() => null)
        if (!fileStat?.isFile()) continue

        if (entry === 'package.json') {
          ecosystems.push('npm')
          manifests.push(entryPath)
        } else if (
          entry === 'package-lock.json' ||
          entry === 'yarn.lock' ||
          entry === 'pnpm-lock.yaml'
        ) {
          lockfiles.push(entryPath)
        } else if (entry === 'requirements.txt' || entry === 'pyproject.toml') {
          ecosystems.push('pypi')
          manifests.push(entryPath)
        } else if (entry === 'go.mod') {
          ecosystems.push('go')
          manifests.push(entryPath)
        }
      }
    } catch {
      // Root not readable — skip
    }

    packages.push({
      root,
      ecosystems: [...new Set(ecosystems)],
      manifests,
      lockfiles,
    })
  }

  return { packages }
}

/**
 * @param {string} filePath
 */
export async function hashFile(filePath) {
  try {
    const content = await readFile(filePath)
    return createHash('sha256').update(content).digest('hex')
  } catch {
    return ''
  }
}
