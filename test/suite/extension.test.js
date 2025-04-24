const assert = require('assert');
const vscode = require('vscode');

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Starting tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('rails-goto-definition'));
  });

  test('Activation test', async () => {
    const extension = vscode.extensions.getExtension('rails-goto-definition');
    assert.ok(extension);
    
    if (!extension.isActive) {
      await extension.activate();
    }
    
    assert.ok(extension.isActive);
  });
});
