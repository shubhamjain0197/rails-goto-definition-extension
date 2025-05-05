/**
 * Standalone test file for model associations
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');

// Mock VS Code module before requiring the extension
global.vscode = {
  window: {
    showInformationMessage: () => {},
    showErrorMessage: () => {}
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/mock/workspace/root' } }]
  },
  commands: {
    executeCommand: () => Promise.resolve()
  },
  Position: class Position {
    constructor(line, character) {
      this.line = line;
      this.character = character;
    }
  },
  Selection: class Selection {
    constructor(anchor, active) {
      this.anchor = anchor;
      this.active = active;
    }
  },
  Range: class Range {
    constructor(start, end) {
      this.start = start;
      this.end = end;
    }
  },
  Uri: {
    file: (path) => ({ fsPath: path })
  },
  TextEditorRevealType: {
    InCenter: 2
  }
};

// Mock FS module
const originalFsExistsSync = fs.existsSync;
const originalFsReadFileSync = fs.readFileSync;

fs.existsSync = function(path) {
  if (path.includes('app/models/user.rb') || 
      path.includes('app/models/post.rb') || 
      path.includes('app/models/comment.rb') ||
      path.includes('app/models/category.rb') ||
      path.includes('app/models/profile.rb') ||
      path.includes('app/models/organization.rb') ||
      path.includes('app/models/tag.rb')) {
    return true;
  }
  return originalFsExistsSync.apply(fs, arguments);
};

fs.readFileSync = function(path, encoding) {
  if (path.includes('app/models/user.rb')) {
    return `
class User < ApplicationRecord
  has_many :posts
  has_many :comments
  has_one :profile
  belongs_to :team, class_name: 'Organization', optional: true
end
    `;
  } else if (path.includes('app/models/post.rb')) {
    return `
class Post < ApplicationRecord
  belongs_to :user
  belongs_to :category
  has_many :comments
  has_and_belongs_to_many :tags
end
    `;
  } else if (path.includes('app/models/comment.rb')) {
    return `
class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post
end
    `;
  } else if (path.includes('app/models/category.rb')) {
    return `
class Category < ApplicationRecord
  has_many :posts
end
    `;
  }
  return originalFsReadFileSync.apply(fs, arguments);
};

// Mock glob module
global.glob = {
  sync: () => [
    'app/models/user.rb',
    'app/models/post.rb',
    'app/models/comment.rb',
    'app/models/category.rb',
    'app/models/profile.rb',
    'app/models/organization.rb',
    'app/models/tag.rb'
  ]
};

// Now require the extension
const extension = require('../../extension');

// Create and configure the mocha test
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Define our tests
const suite = new Mocha.Suite('Model Associations');

suite.addTest(new Mocha.Test('should find a belongs_to association', async function() {
  const result = await extension.findAssociatedModel(
    '/mock/workspace/root',
    'Post',
    'user'
  );
  
  assert.strictEqual(result !== null, true);
  if (result) {
    assert.strictEqual(result.associationType, 'belongs_to');
    assert.strictEqual(path.basename(result.filePath), 'user.rb');
  }
}));

suite.addTest(new Mocha.Test('should find a has_many association', async function() {
  const result = await extension.findAssociatedModel(
    '/mock/workspace/root',
    'User',
    'posts'
  );
  
  assert.strictEqual(result !== null, true);
  if (result) {
    assert.strictEqual(result.associationType, 'has_many');
    assert.strictEqual(path.basename(result.filePath), 'post.rb');
  }
}));

suite.addTest(new Mocha.Test('should handle class_name option in association', async function() {
  const result = await extension.findAssociatedModel(
    '/mock/workspace/root',
    'User',
    'team'
  );
  
  assert.strictEqual(result !== null, true);
  if (result) {
    assert.strictEqual(result.associationType, 'belongs_to');
    assert.strictEqual(path.basename(result.filePath), 'organization.rb');
  }
}));

// Add the suite to mocha
mocha.suite.addSuite(suite);

// Run the tests
console.log('Running model association tests...');
mocha.run(failures => {
  // Reset mocked functions when done
  fs.existsSync = originalFsExistsSync;
  fs.readFileSync = originalFsReadFileSync;
  
  // Exit with appropriate code
  process.exit(failures ? 1 : 0);
});
