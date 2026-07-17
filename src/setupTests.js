// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Jest's jsdom test environment (bundled with react-scripts 5 / Jest 27) does
// not expose TextEncoder/TextDecoder on the global object, but react-router
// v7 relies on them at import time. Polyfill from Node's `util` module so
// modules that import react-router-dom don't crash during tests.
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
