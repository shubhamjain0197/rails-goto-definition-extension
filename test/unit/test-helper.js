/**
 * Test helper file that properly mocks VS Code API before requiring the extension
 */

const proxyquire = require('proxyquire');
const vscodeMock = require('./vscode.mock');

// Use proxyquire to load the extension with mocked vscode
const extension = proxyquire('../../extension', {
  'vscode': vscodeMock
});

module.exports = extension;
