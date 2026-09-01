import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, normaliseSettings } from './settings'

describe('settings', () => {
  it('falls back to the defaults for anything unusable', () => {
    expect(normaliseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normaliseSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(normaliseSettings({ water: 'lots', trails: 1 })).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps values that are in range', () => {
    expect(normaliseSettings({ water: 0.55, trails: false }).water).toBe(0.55)
    expect(normaliseSettings({ trails: false }).trails).toBe(false)
  })

  it('clamps values that are out of range', () => {
    expect(normaliseSettings({ water: 9 }).water).toBe(1)
    expect(normaliseSettings({ water: -3 }).water).toBe(0)
    expect(normaliseSettings({ pitch: 5 }).pitch).toBe(0.8)
    expect(normaliseSettings({ rotation: -1 }).rotation).toBe(3)
    expect(normaliseSettings({ rotation: 7 }).rotation).toBe(3)
  })
})
