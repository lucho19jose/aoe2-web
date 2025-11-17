/**
 * Test setup file for Vitest
 */
import { expect } from 'vitest'
import { config } from '@vue/test-utils'
import { Quasar } from 'quasar'

// Configure Vue Test Utils to use Quasar globally
config.global.plugins = [Quasar]

// Mock window.matchMedia for Quasar
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
})
