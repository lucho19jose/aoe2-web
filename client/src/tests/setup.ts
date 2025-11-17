/**
 * Test setup file
 * This file is run before each test file
 */

// Mock window.matchMedia
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
    dispatchEvent: () => {},
  }),
})

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url: string) {
    console.log('Mock WebSocket created:', url)
  }
  close() {}
  send() {}
} as any
