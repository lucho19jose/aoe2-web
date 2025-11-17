/**
 * Utility function tests
 */
import { describe, it, expect } from 'vitest'

describe('Math utilities', () => {
  it('adds numbers correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('multiplies numbers correctly', () => {
    expect(2 * 3).toBe(6)
  })
})

describe('String utilities', () => {
  it('concatenates strings correctly', () => {
    expect('hello' + ' ' + 'world').toBe('hello world')
  })
})
