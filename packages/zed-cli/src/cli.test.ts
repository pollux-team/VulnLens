import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const cliPath = resolve(__dirname, '../dist/cli.js')

describe('CLI', () => {
  it('health command outputs JSON', async () => {
    const manifest = resolve(__dirname, '../../engine/package.json')
    const output = execSync(`node ${cliPath} health ${manifest}`, {
      encoding: 'utf-8',
      timeout: 15000,
    })
    const result = JSON.parse(output)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('name')
    expect(result[0]).toHaveProperty('latest')
  }, 20000)

  it('scan command outputs JSON', () => {
    const output = execSync(
      `node ${cliPath} scan ${resolve(__dirname, '../../engine')} --no-network`,
      { encoding: 'utf-8', timeout: 10000 },
    )
    const result = JSON.parse(output)
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('findings')
    expect(result).toHaveProperty('stats')
  })
})
