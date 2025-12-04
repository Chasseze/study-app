// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsPDF
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock export functions for lazy loading
jest.mock('./lib/export', () => ({
  exportAsMarkdown: jest.fn(),
  exportAsPDF: jest.fn().mockResolvedValue(true),
  exportAsWord: jest.fn().mockReturnValue(true),
  exportAllAsJSON: jest.fn(),
  importFromJSON: jest.fn()
}));
