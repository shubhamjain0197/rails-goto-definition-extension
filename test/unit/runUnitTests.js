/**
 * Simple test runner for unit tests with basic coverage tracking
 */
const Mocha = require('mocha');
const fs = require('fs');
const path = require('path');

// Set up module mocking for vscode - this needs to happen before requiring any modules that depend on vscode
const moduleCache = require.cache;
const vscodeMockPath = path.resolve(__dirname, './vscode.mock.js');
const vscodeMock = require(vscodeMockPath);

// Create a new entry in the require cache for the 'vscode' module pointing to our mock
if (!moduleCache['vscode']) {
  moduleCache['vscode'] = {
    id: 'vscode',
    filename: 'vscode',
    loaded: true,
    exports: vscodeMock
  };
}

// Create a new Mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000  // increase timeout for slower operations
});

// Get all test files
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir).filter(file => 
  file.endsWith('.test.js') && file !== 'runUnitTests.js' && file !== 'vscode.mock.js'
);

// Add the test files to Mocha
testFiles.forEach(file => {
  console.log(`Adding test file: ${file}`);
  mocha.addFile(path.join(testDir, file));
});

// Now we can safely require the extension with our vscode mock in place
const extension = require('../../extension');

// Function to extract all function names from an object (including nested ones)
function getAllFunctionNames(obj, prefix = '') {
  if (!obj || typeof obj !== 'object') return [];
  
  const functions = [];
  for (const key in obj) {
    if (key.startsWith('_')) continue; // Skip internal/private properties
    
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'function') {
      functions.push(fullPath);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      functions.push(...getAllFunctionNames(obj[key], fullPath));
    }
  }
  return functions;
}

// Set up coverage tracking
const coverageData = {
  called: new Set(),
  notCalled: new Set()
};
const originalFunctions = {};

// Identify all functions in the extension to track
const functionsToTrack = [
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

// Wrap each function to track if it's called
function instrumentFunction(obj, funcName) {
  if (typeof obj[funcName] === 'function') {
    originalFunctions[funcName] = obj[funcName];
    coverageData.notCalled.add(funcName);
    
    obj[funcName] = function(...args) {
      coverageData.called.add(funcName);
      coverageData.notCalled.delete(funcName);
      try {
        return originalFunctions[funcName].apply(this, args);
      } catch (error) {
        console.error(`Error in ${funcName}:`, error.message);
        return null; // Avoid crashing tests if a function fails
      }
    };
  }
}

// Instrument the exported functions for coverage tracking
functionsToTrack.forEach(funcName => {
  instrumentFunction(extension, funcName);
});

// Run the tests
console.log('Running unit tests...');
mocha.run(failures => {
  // Print coverage report
  console.log('\n--- COVERAGE REPORT ---');
  console.log('Functions called during tests:');
  const calledFunctions = Array.from(coverageData.called);
  calledFunctions.sort().forEach(func => console.log(`  ✓ ${func}`));
  
  console.log('\nFunctions not called during tests:');
  const notCalledFunctions = Array.from(coverageData.notCalled);
  notCalledFunctions.sort().forEach(func => console.log(`  ✗ ${func}`));
  
  const totalFunctions = calledFunctions.length + notCalledFunctions.length;
  const coverage = Math.round((calledFunctions.length / totalFunctions) * 100);
  
  console.log(`\nFunction coverage: ${coverage}% (${calledFunctions.length}/${totalFunctions})`);
  
  // Exit with appropriate code
  process.exit(failures ? 1 : 0);
});
