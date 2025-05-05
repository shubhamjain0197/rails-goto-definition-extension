/**
 * Simple test script to verify our enhancements
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const proxyquire = require('proxyquire').noCallThru();

// Create VS Code mock
const vscodeMock = {
  window: {
    showInformationMessage: (msg) => console.log(`[INFO] ${msg}`),
    showErrorMessage: (msg) => console.error(`[ERROR] ${msg}`)
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: path.resolve(__dirname) } }]
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
  Uri: {
    file: (p) => ({ fsPath: p })
  }
};

// Create simple glob mock
const globMock = {
  sync: (pattern, options) => {
    const rootPath = options.cwd || __dirname;
    
    // Simplified pattern matching based on the test
    if (pattern.includes('app/models')) {
      return ['app/models/user.rb', 'app/models/post.rb'];
    } else if (pattern.includes('app/mailers')) {
      return ['app/mailers/user_mailer.rb'];
    } else if (pattern.includes('app/controllers/concerns')) {
      return ['app/controllers/concerns/authenticatable.rb'];
    } else if (pattern.includes('app/jobs')) {
      return ['app/jobs/user_notification_job.rb'];
    } else if (pattern === '**/*.rb') {
      return [
        'app/models/user.rb',
        'app/models/post.rb',
        'app/mailers/user_mailer.rb',
        'app/controllers/concerns/authenticatable.rb',
        'app/jobs/user_notification_job.rb'
      ];
    }
    return [];
  }
};

// Load the extension with mocks
const extension = proxyquire('../../extension', {
  'vscode': vscodeMock,
  'glob': globMock
});

// Basic assertion helper
function expectEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`✅ PASS: ${message}`);
  } else {
    console.log(`❌ FAIL: ${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

function expectNotNull(value, message) {
  if (value !== null) {
    console.log(`✅ PASS: ${message}`);
    return true;
  } else {
    console.log(`❌ FAIL: ${message} - Got null`);
    return false;
  }
}

// Test Class Methods
async function testClassMethodFinding() {
  console.log("\n----- Testing Class Method Finding -----");
  
  // This will test if our regular expression pattern for class methods is working
  const pattern = extension.PATTERNS.CLASS_METHOD;
  const regex = new RegExp(pattern);
  
  // Test with a class method definition
  const classMethodCode = "def self.find_by_email(email)";
  const match = classMethodCode.match(regex);
  
  expectNotNull(match, "Class method regex pattern should match 'def self.find_by_email'");
  if (match) {
    expectEqual(match[1], "find_by_email", "Should extract the method name correctly");
  }
  
  // Test with different spacing
  const classMethodWithSpacing = "def self . published";
  const matchWithSpacing = classMethodWithSpacing.match(regex);
  
  expectNotNull(matchWithSpacing, "Class method regex should handle different spacing");
  if (matchWithSpacing) {
    expectEqual(matchWithSpacing[1], "published", "Should extract method name with different spacing");
  }
}

// Additional test functions as needed
async function runTests() {
  console.log("Starting tests...");
  
  await testClassMethodFinding();
  
  console.log("\nTests completed!");
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
});
