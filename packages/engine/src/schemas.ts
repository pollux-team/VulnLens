import { z } from 'zod'

export const ENGINE_API_VERSION = '1'

export const SeveritySchema = z.enum(['low', 'moderate', 'high', 'critical'])

export const EcosystemSchema = z.enum([
  'npm',
  'yarn',
  'pnpm',
  'pypi',
  'crates',
  'go',
  'rubygems',
  'packagist',
  'unknown',
])

export const DependencyKindSchema = z.enum(['direct', 'transitive'])

export const ScanStatusSchema = z.enum(['ok', 'degraded', 'failed'])

export const AdvisoryIdSchema = z.object({
  system: z.enum(['cve', 'ghsa', 'osv', 'other']),
  value: z.string(),
})

export const PackageRefSchema = z.object({
  ecosystem: EcosystemSchema,
  name: z.string(),
  version: z.string().nullable(),
  purl: z.string().nullable(),
  range: z.string().nullable(),
})

export const VulnerabilitySchema = z.object({
  ids: z.array(AdvisoryIdSchema),
  title: z.string(),
  severity: SeveritySchema,
  score: z.number().nullable(),
  summary: z.string().nullable(),
  url: z.string().nullable(),
  fixedIn: z.array(z.string()).nullable(),
  publishedAt: z.string().nullable(),
})

export const ManifestLocatorSchema = z.object({
  packageName: z.string(),
  section: z.enum([
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]),
  line: z.number(),
  charStart: z.number(),
  charEnd: z.number(),
})

export const OccurrenceSchema = z.object({
  package: PackageRefSchema,
  kind: DependencyKindSchema,
  manifestPath: z.string(),
  lockfilePath: z.string().nullable(),
  dependencyPath: z.array(z.string()),
  manifestLocator: ManifestLocatorSchema.optional(),
})

export const FixHintSchema = z.object({
  type: z.enum(['update', 'replace', 'remove', 'none', 'unknown']),
  message: z.string(),
  suggestedVersion: z.string().nullable(),
  commandHint: z.string().nullable(),
})

export const FindingSchema = z.object({
  id: z.string(),
  vulnerability: VulnerabilitySchema,
  occurrence: OccurrenceSchema,
  fix: FixHintSchema.nullable(),
  scanner: z.string(),
})

export const IgnoreRuleSchema = z.object({
  id: z.string(),
  advisory: z.string().nullable(),
  packageName: z.string().nullable(),
  ecosystem: EcosystemSchema.nullable(),
  reason: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
})

export const PolicySchema = z.object({
  minSeverity: SeveritySchema.default('moderate'),
  enabledEcosystems: z
    .union([z.array(EcosystemSchema), z.literal('all')])
    .default('all'),
  directOnly: z.boolean().default(false),
  allowNetwork: z.boolean().default(true),
  ignores: z.array(IgnoreRuleSchema).default([]),
  timeoutMs: z.number().default(30_000),
})

export const ScanIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string().nullable(),
  ecosystem: EcosystemSchema.nullable(),
  retriable: z.boolean(),
})

export const ScanResultStatsSchema = z.object({
  bySeverity: z.object({
    low: z.number(),
    moderate: z.number(),
    high: z.number(),
    critical: z.number(),
  }),
  findingCount: z.number(),
  cacheHit: z.boolean(),
})

export const ScanResultMetaSchema = z.object({
  engineVersion: z.string(),
  scannersUsed: z.array(z.string()),
})

export const ScanResultSchema = z.object({
  apiVersion: z.string(),
  status: ScanStatusSchema,
  scannedAt: z.string(),
  roots: z.array(z.string()),
  findings: z.array(FindingSchema),
  issues: z.array(ScanIssueSchema),
  stats: ScanResultStatsSchema,
  meta: ScanResultMetaSchema,
})

export const SEVERITY_RANK = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3,
}

export const SEVERITY_ALIAS = {
  medium: 'moderate',
}

export const DEFAULT_POLICY = {
  minSeverity: 'moderate',
  enabledEcosystems: 'all',
  directOnly: false,
  allowNetwork: true,
  ignores: [],
  timeoutMs: 30_000,
}

export function emptyFindings() {
  return FindingSchema.array().parse([])
}

export function emptyIssues() {
  return ScanIssueSchema.array().parse([])
}

export function emptyBySeverity() {
  return { low: 0, moderate: 0, high: 0, critical: 0 }
}

export function createEmptyScanResult(roots = []) {
  return ScanResultSchema.parse({
    apiVersion: ENGINE_API_VERSION,
    status: 'ok',
    scannedAt: '',
    roots,
    findings: [],
    issues: [],
    stats: {
      bySeverity: emptyBySeverity(),
      findingCount: 0,
      cacheHit: false,
    },
    meta: {
      engineVersion: ENGINE_API_VERSION,
      scannersUsed: [],
    },
  })
}
