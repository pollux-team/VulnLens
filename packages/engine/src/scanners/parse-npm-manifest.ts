import { readFile } from 'node:fs/promises'

import * as jsonc from 'jsonc-parser'

import { mutableList } from '../schemas.js'

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]

/**
 * @param {unknown} version
 */
export function cleanVersion(version) {
  return String(version ?? '')
    .replace(/^[\^~>=<]*/, '')
    .replace(/\s.*$/, '')
    .trim()
}

/**
 * @param {string} content
 * @param {number} offset
 */
export function offsetToLineChar(content, offset) {
  const line = content.slice(0, offset).split('\n').length - 1
  const lineStart = content.lastIndexOf('\n', offset - 1) + 1
  return {
    line,
    charStart: offset - lineStart,
  }
}

/**
 * Parse package.json / JSONC and return dependency packages with locators.
 * @param {string} manifestPath
 */
export async function parseNpmManifest(manifestPath) {
  let content
  try {
    content = await readFile(manifestPath, 'utf-8')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read manifest'
    return { ok: false, error: message, packages: [] }
  }

  const errors = mutableList()
  // jsonc-parser mutates errors with ParseError objects
  const root = jsonc.parseTree(content, errors)
  if (errors.length > 0 || !root) {
    return {
      ok: false,
      error: `Failed to parse ${manifestPath}`,
      packages: [],
    }
  }

  const packages = mutableList()

  for (const section of DEPENDENCY_SECTIONS) {
    const node = jsonc.findNodeAtLocation(root, [section])
    if (!node?.children) continue

    for (const prop of node.children) {
      if (prop.type !== 'property' || !prop.children?.length) continue
      const nameNode = prop.children[0]
      const versionNode = prop.children[1]
      if (!nameNode || !versionNode) continue

      const name = jsonc.getNodeValue(nameNode)
      const rawVersion = jsonc.getNodeValue(versionNode)
      const cleanedVersion = cleanVersion(rawVersion)

      const valueOffset =
        versionNode.offset + (versionNode.type === 'string' ? 1 : 0)
      const valueLength =
        versionNode.type === 'string'
          ? Math.max(versionNode.length - 2, 0)
          : versionNode.length
      const { line, charStart } = offsetToLineChar(content, valueOffset)
      const charEnd = charStart + valueLength

      packages.push({
        name: String(name),
        version: cleanedVersion,
        range: String(rawVersion ?? ''),
        section,
        line,
        charStart,
        charEnd,
      })
    }
  }

  return { ok: true, error: null, packages }
}
