#!/usr/bin/env node
/*
 * Our flavour of semantic versioning.
 *
 * The version is never edited by hand. It is derived from the commit subjects
 * since the last `v*` tag, using Conventional Commits:
 *
 *   feat!: …  or  BREAKING CHANGE: in the body   → major
 *   feat: …                                      → minor
 *   fix: … / perf: …                             → patch
 *   anything else, on its own                    → patch
 *
 * That last rule is the house rule. Upstream semantic-release would publish
 * nothing for a branch of chores, but this repository ships a website on every
 * push to main, and a deployed site with no version is worse than a version
 * that moved for a docs change.
 *
 * Usage:
 *   node scripts/semver.mjs current   the version in package.json
 *   node scripts/semver.mjs next      the version this commit range earns
 *   node scripts/semver.mjs notes     markdown release notes for that range
 *   node scripts/semver.mjs apply     write `next` into package.json
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE = join(ROOT, 'package.json')

const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<breaking>!)?:\s*(?<subject>.+)$/

const SECTIONS = [
  { key: 'breaking', title: 'Breaking changes' },
  { key: 'feat', title: 'Features' },
  { key: 'fix', title: 'Fixes' },
  { key: 'perf', title: 'Performance' },
  { key: 'other', title: 'Other changes' },
]

/** What one commit is, and how far it moves the version. */
export function classify(commit) {
  const match = HEADER.exec(commit.subject ?? '')
  const breaking =
    Boolean(match?.groups.breaking) || /^BREAKING[ -]CHANGE:/m.test(commit.body ?? '')

  if (breaking) return { level: 'major', section: 'breaking', ...fields(match, commit) }

  const type = match?.groups.type
  if (type === 'feat') return { level: 'minor', section: 'feat', ...fields(match, commit) }
  if (type === 'fix') return { level: 'patch', section: 'fix', ...fields(match, commit) }
  if (type === 'perf') return { level: 'patch', section: 'perf', ...fields(match, commit) }

  return { level: 'patch', section: 'other', ...fields(match, commit) }
}

function fields(match, commit) {
  return {
    scope: match?.groups.scope ?? null,
    subject: match?.groups.subject ?? commit.subject ?? '',
    hash: commit.hash ?? null,
  }
}

const RANK = { none: 0, patch: 1, minor: 2, major: 3 }

/** The largest bump any commit in the range asks for. */
export function bumpFrom(commits) {
  return commits.reduce(
    (highest, commit) =>
      RANK[classify(commit).level] > RANK[highest] ? classify(commit).level : highest,
    'none',
  )
}

export function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version ?? ''))
  if (!match) return null
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
}

export function nextVersion(current, level) {
  const parts = parseVersion(current)
  if (!parts) throw new Error(`Not a version: ${current}`)
  if (level === 'none') return `${parts.major}.${parts.minor}.${parts.patch}`
  if (level === 'major') return `${parts.major + 1}.0.0`
  if (level === 'minor') return `${parts.major}.${parts.minor + 1}.0`
  return `${parts.major}.${parts.minor}.${parts.patch + 1}`
}

export function releaseNotes(version, commits, { repository } = {}) {
  const grouped = new Map(SECTIONS.map((section) => [section.key, []]))
  for (const commit of commits) {
    const entry = classify(commit)
    grouped.get(entry.section).push(entry)
  }

  const lines = [`## v${version}`, '']

  for (const section of SECTIONS) {
    const entries = grouped.get(section.key)
    if (entries.length === 0) continue
    lines.push(`### ${section.title}`, '')
    for (const entry of entries) {
      const scope = entry.scope ? `**${entry.scope}:** ` : ''
      const link =
        repository && entry.hash
          ? ` ([${entry.hash.slice(0, 7)}](${repository}/commit/${entry.hash}))`
          : ''
      lines.push(`- ${scope}${entry.subject}${link}`)
    }
    lines.push('')
  }

  if (lines.length === 2) lines.push('No user-visible changes.', '')
  return lines.join('\n')
}

/* ------------------------------------------------------------------- git */

function git(...args) {
  // stderr is captured rather than inherited: `git describe` on a repository
  // with no tags is an expected outcome here, not something to print.
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function lastTag() {
  try {
    return git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*.[0-9]*.[0-9]*')
  } catch {
    return null
  }
}

/** Commits since the last release tag, oldest first. */
export function commitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD'
  const raw = git('log', range, '--reverse', '--no-merges', '--format=%H%x1f%s%x1f%b%x1e')
  if (!raw) return []

  return raw
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, body] = record.split('\x1f')
      return { hash, subject, body }
    })
}

function readPackage() {
  return JSON.parse(readFileSync(PACKAGE, 'utf8'))
}

function resolve() {
  const pkg = readPackage()
  const tag = lastTag()
  // No tags yet on a repository that already declares a version: start from
  // what package.json says rather than from 0.0.0.
  const base = tag ?? `v${pkg.version}`
  const commits = commitsSince(tag)
  const level = bumpFrom(commits)
  return { pkg, tag, base, commits, level, version: nextVersion(base, level) }
}

function main(command) {
  if (command === 'current') return readPackage().version

  const { commits, level, version, pkg } = resolve()

  if (command === 'next') return version
  if (command === 'level') return level
  if (command === 'notes') {
    const repository = pkg.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '')
    return releaseNotes(version, commits, { repository })
  }
  if (command === 'apply') {
    const raw = readFileSync(PACKAGE, 'utf8')
    writeFileSync(PACKAGE, raw.replace(/"version":\s*"[^"]*"/, `"version": "${version}"`))
    return version
  }

  throw new Error(`Unknown command: ${command}. Try current, next, level, notes or apply.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${main(process.argv[2] ?? 'next')}\n`)
  } catch (problem) {
    process.stderr.write(`${problem.message}\n`)
    process.exit(1)
  }
}
