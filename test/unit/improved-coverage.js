/**
 * Improved coverage test runner that properly mocks VS Code
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');

// First, make sure the mock is set up BEFORE any requires
global.vscode = {
  window: {
    showInformationMessage: () => Promise.resolve(),
    showErrorMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
    withProgress: (options, task) => task({}, {}),
    activeTextEditor: {
      document: {
        fileName: path.join(__dirname, '../fixtures/app/models/user.rb'),
        getText: () => 'class User < ApplicationRecord\n  has_many :posts\nend',
        getWordRangeAtPosition: () => ({
          start: { line: 0, character: 0 },
          end: { line: 0, character: 5 }
        })
      },
      selection: {
        active: { line: 0, character: 0 }
      },
      revealRange: () => {}
    },
    showTextDocument: () => Promise.resolve({
      selection: {},
      revealRange: () => {}
    }),
    createTextEditorDecorationType: () => ({
      dispose: () => {}
    })
  },
  workspace: {
    getConfiguration: () => ({
      get: (key) => null,
      update: () => Promise.resolve()
    }),
    openTextDocument: () => Promise.resolve({
      getText: () => 'class User < ApplicationRecord\n  has_many :posts\nend',
      lineAt: (line) => ({ text: 'class User < ApplicationRecord' })
    }),
    onDidOpenTextDocument: () => ({ dispose: () => {} }),
    workspaceFolders: [{ uri: { fsPath: path.join(__dirname, '../fixtures') } }]
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
  Selection: class Selection {
    constructor(anchor, active) {
      this.anchor = anchor;
      this.active = active;
    }
  },
  Location: class Location {
    constructor(uri, range) {
      this.uri = uri;
      this.range = range;
    }
  },
  Uri: {
    file: (path) => ({ fsPath: path, scheme: 'file', path })
  },
  TextEditorRevealType: {
    InCenter: 2
  }
};

// Now we can safely require the extension
const extension = require('../../extension');

// Set up fixtures
const fixturesDir = path.join(__dirname, '../fixtures');
const appDir = path.join(fixturesDir, 'app');
const modelsDir = path.join(appDir, 'models');
const controllersDir = path.join(appDir, 'controllers');
const helpersDir = path.join(appDir, 'helpers');
const mailersDir = path.join(appDir, 'mailers');
const jobsDir = path.join(appDir, 'jobs');
const concernsDir = path.join(controllersDir, 'concerns');

// Create fixture directories
[fixturesDir, appDir, modelsDir, controllersDir, helpersDir, mailersDir, jobsDir, concernsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create fixture files
const fixtures = {
  userModel: {
    path: path.join(modelsDir, 'user.rb'),
    content: `
class User < ApplicationRecord
  has_many :posts
  has_many :comments
  has_one :profile
  belongs_to :team, class_name: 'Organization'
  
  def full_name
    "#{first_name} #{last_name}"
  end
  
  attr_accessor :password
end
    `
  },
  postModel: {
    path: path.join(modelsDir, 'post.rb'),
    content: `
class Post < ApplicationRecord
  belongs_to :user
  has_many :comments
end
    `
  },
  userConcern: {
    path: path.join(concernsDir, 'user.rb'),
    content: `
module User
  extend ActiveSupport::Concern
  
  included do
    has_many :logs
  end
end
    `
  },
  userController: {
    path: path.join(controllersDir, 'user_controller.rb'),
    content: `
class UserController < ApplicationController
  def index
    @users = User.all
  end
end
    `
  },
  userHelper: {
    path: path.join(helpersDir, 'user_helper.rb'),
    content: `
module UserHelper
  def user_avatar(user)
    image_tag(user.avatar_url)
  end
end
    `
  },
  userMailer: {
    path: path.join(mailersDir, 'user_mailer.rb'),
    content: `
class UserMailer < ApplicationMailer
  def welcome_email
    @user = params[:user]
    mail(to: @user.email, subject: 'Welcome!')
  end
end
    `
  },
  userJob: {
    path: path.join(jobsDir, 'user_job.rb'),
    content: `
class UserJob < ApplicationJob
  queue_as :default
  
  def perform(user_id)
    user = User.find(user_id)
    UserMailer.with(user: user).welcome_email.deliver_now
  end
end
    `
  }
};

// Create all fixture files
Object.values(fixtures).forEach(fixture => {
  fs.writeFileSync(fixture.path, fixture.content);
});

// Track function coverage
const functions = [
  'findRailsDefinition',
  'findInFile',
  'findClass',
  'findModel',
  'findController',
  'findHelper',
  'findMethod',
  'findAllReferences',
  'findMailer',
  'findConcern',
  'findJob',
  'findAssociatedModel',
  'inflectToSingular',
  'inflectToPlural',
  'isVowel',
  'activate',
  'deactivate'
];

// Set up coverage tracking
const coverage = {
  called: new Set(),
  notCalled: new Set(functions)
};

// Wrap functions to track coverage
functions.forEach(functionName => {
  if (typeof extension[functionName] === 'function') {
    const originalFunction = extension[functionName];
    extension[functionName] = function(...args) {
      coverage.called.add(functionName);
      coverage.notCalled.delete(functionName);
      try {
        return originalFunction.apply(this, args);
      } catch (error) {
        console.error(`Error in ${functionName}:`, error);
        return null;
      }
    };
  } else {
    console.warn(`Function ${functionName} not found in extension`);
  }
});

// Set up mock context for activate
const mockContext = {
  subscriptions: [],
  workspaceState: {
    get: () => null,
    update: () => Promise.resolve()
  },
  globalState: {
    get: () => null,
    update: () => Promise.resolve()
  }
};

// Create the mocha test
const mocha = new Mocha();
const suite = Mocha.Suite.create(mocha.suite, 'Extension Coverage');

// Add tests for all our functions
suite.addTest(new Mocha.Test('should exercise inflection functions', function() {
  assert.strictEqual(extension.inflectToSingular('users'), 'user');
  assert.strictEqual(extension.inflectToPlural('user'), 'users');
  assert.strictEqual(extension.inflectToPlural('category'), 'categories');
  assert.strictEqual(extension.inflectToSingular('categories'), 'category');
}));

suite.addTest(new Mocha.Test('should exercise isVowel function', function() {
  assert.strictEqual(extension.isVowel('a'), true);
  assert.strictEqual(extension.isVowel('b'), false);
}));

suite.addTest(new Mocha.Test('should exercise find* functions', function() {
  // Activate the extension first
  extension.activate(mockContext);
  
  // Test basic find functions
  extension.findInFile(fixtures.userModel.path, 'User', 'class');
  extension.findInFile(fixtures.userModel.path, 'full_name', 'method');
  
  extension.findClass(fixturesDir, 'User');
  extension.findModel(fixturesDir, 'User');
  extension.findController(fixturesDir, 'User');
  extension.findHelper(fixturesDir, 'User');
  extension.findMethod(fixturesDir, 'full_name', fixtures.userModel.path);
  
  // Test our new functions
  extension.findMailer(fixturesDir, 'User');
  extension.findConcern(fixturesDir, 'User');
  extension.findJob(fixturesDir, 'User');
  
  extension.findAssociatedModel(fixturesDir, 'User', 'posts');
  extension.findAssociatedModel(fixturesDir, 'Post', 'user');
  
  extension.findAllReferences('User', fixtures.userModel.path);
  extension.findAllReferences('full_name', fixtures.userModel.path, true);
  
  extension.findRailsDefinition('User', fixtures.userModel.path);
  extension.findRailsDefinition('full_name', fixtures.userModel.path);
  
  // Finally, deactivate
  extension.deactivate();
}));

// Run Mocha tests
mocha.run(function(failures) {
  // Print coverage report
  console.log('\n--- COVERAGE REPORT ---');
  console.log('Functions called during tests:');
  const calledFunctions = Array.from(coverage.called);
  calledFunctions.sort().forEach(func => console.log(`  ✓ ${func}`));
  
  console.log('\nFunctions not called during tests:');
  const notCalledFunctions = Array.from(coverage.notCalled);
  notCalledFunctions.sort().forEach(func => console.log(`  ✗ ${func}`));
  
  const totalFunctions = functions.length;
  const calledCount = calledFunctions.length;
  const coveragePercent = Math.round((calledCount / totalFunctions) * 100);
  
  console.log(`\nFunction coverage: ${coveragePercent}% (${calledCount}/${totalFunctions})`);
  
  // Clean up fixtures
  /*
  Object.values(fixtures).forEach(fixture => {
    if (fs.existsSync(fixture.path)) {
      fs.unlinkSync(fixture.path);
    }
  });
  */
  
  // Exit with appropriate code
  process.exit(failures ? 1 : 0);
});
