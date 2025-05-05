/**
 * Test setup file - ensures vscode is properly mocked before loading extension
 */

// Mock the vscode module BEFORE requiring the extension
jest.mock('vscode', () => require('./vscode.mock'), { virtual: true });

// Now it's safe to require the extension
const extension = require('../../extension');

module.exports = extension;
