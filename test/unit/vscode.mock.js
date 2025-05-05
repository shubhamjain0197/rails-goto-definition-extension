/**
 * Mock for the vscode module when running tests outside of VS Code
 */
module.exports = {
  // Basic window operations
  window: {
    showInformationMessage: () => Promise.resolve(),
    showErrorMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
    withProgress: (options, task) => task({}, {}),
    activeTextEditor: null,
    createTextEditorDecorationType: () => ({
      dispose: () => {}
    })
  },
  
  // Workspace operations
  workspace: {
    getConfiguration: () => ({
      get: (key) => null,
      update: () => Promise.resolve()
    }),
    onDidOpenTextDocument: () => ({ dispose: () => {} }),
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }]
  },
  
  // Commands
  commands: {
    executeCommand: () => Promise.resolve(),
    registerCommand: () => ({ dispose: () => {} })
  },
  
  // Classes and types
  Position: class {
    constructor(line = 0, character = 0) {
      this.line = line;
      this.character = character;
    }
  },
  
  Range: class {
    constructor(startLineOrPosition, startCharOrEndPosition, endLine, endCharacter) {
      if (startLineOrPosition instanceof vscode.Position) {
        this.start = startLineOrPosition;
        this.end = startCharOrEndPosition;
      } else {
        this.start = new vscode.Position(startLineOrPosition, startCharOrEndPosition);
        this.end = new vscode.Position(endLine, endCharacter);
      }
    }
  },
  
  Location: class {
    constructor(uri, rangeOrPosition) {
      this.uri = uri;
      this.range = rangeOrPosition;
    }
  },
  
  Uri: {
    file: (path) => ({ 
      fsPath: path,
      scheme: 'file',
      path: path
    })
  },
  
  // Enums
  ProgressLocation: {
    Notification: 1
  },
  
  // Extension management
  extensions: {
    getExtension: () => ({
      activate: () => Promise.resolve(),
      isActive: true
    })
  }
};

// Self-reference to make object creation work
const vscode = module.exports;
