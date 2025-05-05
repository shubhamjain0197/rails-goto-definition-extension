/**
 * Custom script to run NYC coverage on our unit tests
 */

// Set up mock for vscode before requiring any modules
global.vscode = {
  window: {
    showInformationMessage: () => {},
    showErrorMessage: () => {},
    withProgress: (options, task) => task({}, {})
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: __dirname + '/test/fixtures' } }]
  },
  commands: {
    executeCommand: () => Promise.resolve(),
    registerCommand: () => ({ dispose: () => {} })
  },
  Position: class Position {
    constructor(line, character) {
      this.line = line;
      this.character = character;
    }
  },
  Range: class Range {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  },
  Location: class Location {
    constructor(uri, range) {
      this.uri = uri;
      this.range = range;
    }
  },
  Uri: {
    file: (path) => ({ fsPath: path, scheme: 'file' })
  },
  TextEditorRevealType: {
    InCenter: 2
  }
};

// Load the mocha runner
const Mocha = require('mocha');
const path = require('path');
const fs = require('fs');

// Create a new mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Add the test files
mocha.addFile(path.join(__dirname, 'test/unit/extension.coverage.js'));

// Run the tests
console.log('Running coverage tests');
mocha.run(failures => {
  process.exit(failures ? 1 : 0);
});
