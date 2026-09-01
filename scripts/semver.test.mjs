import { describe, expect, it } from 'vitest'
import { bumpFrom, classify, nextVersion, parseVersion, releaseNotes } from './semver.mjs'

const commit = (subject, body = '') => ({ hash: 'a'.repeat(40), subject, body })

describe('classify', () => {
  it('reads the conventional-commit header', () => {
    expect(classify(commit('feat(board): water'))).toMatchObject({
      level: 'minor',
      section: 'feat',
      scope: 'board',
      subject: 'water',
    })
  })

  it('treats an exclamation mark as breaking', () => {
    expect(classify(commit('feat!: drop the old board')).level).toBe('major')
    expect(classify(commit('refactor(api)!: rename everything')).level).toBe('major')
  })

  it('treats a BREAKING CHANGE footer as breaking', () => {
    expect(classify(commit('fix: tidy', 'BREAKING CHANGE: the FEN format moved')).level).toBe(
      'major',
    )
  })

  it('maps fix and perf to a patch', () => {
    expect(classify(commit('fix: ripple restart')).level).toBe('patch')
    expect(classify(commit('perf: fewer repaints')).level).toBe('patch')
  })

  it('still bumps a patch for a commit that follows no convention', () => {
    expect(classify(commit('tidy up the readme'))).toMatchObject({
      level: 'patch',
      section: 'other',
      subject: 'tidy up the readme',
    })
  })
})

describe('bumpFrom', () => {
  it('takes the largest bump in the range', () => {
    expect(bumpFrom([commit('fix: a'), commit('feat: b'), commit('chore: c')])).toBe('minor')
    expect(bumpFrom([commit('fix: a'), commit('feat!: b')])).toBe('major')
    expect(bumpFrom([commit('chore: c')])).toBe('patch')
  })

  it('asks for nothing when there is nothing', () => {
    expect(bumpFrom([])).toBe('none')
  })
})

describe('nextVersion', () => {
  it('bumps each level and resets the ones below it', () => {
    expect(nextVersion('1.4.7', 'major')).toBe('2.0.0')
    expect(nextVersion('1.4.7', 'minor')).toBe('1.5.0')
    expect(nextVersion('1.4.7', 'patch')).toBe('1.4.8')
    expect(nextVersion('1.4.7', 'none')).toBe('1.4.7')
  })

  it('accepts a tag name as well as a bare version', () => {
    expect(nextVersion('v0.9.9', 'patch')).toBe('0.9.10')
    expect(parseVersion('v2.0.1')).toEqual({ major: 2, minor: 0, patch: 1 })
    expect(parseVersion('banana')).toBeNull()
  })

  it('refuses a version it cannot read', () => {
    expect(() => nextVersion('banana', 'patch')).toThrow(/not a version/i)
  })
})

describe('releaseNotes', () => {
  it('groups commits under their section, breaking first', () => {
    const notes = releaseNotes('2.0.0', [
      commit('feat: online play'),
      commit('fix: ripple restart'),
      commit('feat!: new board'),
      commit('docs: readme'),
    ])

    expect(notes).toContain('## v2.0.0')
    expect(notes.indexOf('Breaking changes')).toBeLessThan(notes.indexOf('Features'))
    expect(notes.indexOf('Features')).toBeLessThan(notes.indexOf('Fixes'))
    expect(notes).toContain('- online play')
    expect(notes).toContain('Other changes')
  })

  it('links commits when a repository is known', () => {
    const notes = releaseNotes('1.0.1', [commit('fix: thing')], {
      repository: 'https://github.com/o/r',
    })
    expect(notes).toContain('https://github.com/o/r/commit/' + 'a'.repeat(40))
  })

  it('says so when a release carries nothing', () => {
    expect(releaseNotes('1.0.1', [])).toContain('No user-visible changes.')
  })
})
