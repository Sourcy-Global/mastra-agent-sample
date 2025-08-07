import { webcrypto } from 'node:crypto';

// Polyfill crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// Also ensure it's available on global scope
if (typeof global !== 'undefined' && typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = webcrypto;
}

export {};