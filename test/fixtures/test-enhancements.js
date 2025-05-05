/**
 * Test script for verifying the Rails Go To Definition enhancements
 */
const path = require('path');
const fs = require('fs');

// Load the extension with vscode mock
global.vscode = {
  window: {
    showInformationMessage: (msg) => console.log(`[INFO] ${msg}`),
    showErrorMessage: (msg) => console.error(`[ERROR] ${msg}`)
  },
  workspace: {
    workspaceFolders: [{ uri: { fsPath: path.resolve(__dirname) } }]
  }
};

// Load the extension
const extension = require('../../extension');

async function runTests() {
  console.log('=== Testing Rails Go To Definition Enhancements ===\n');
  const rootPath = path.resolve(__dirname);
  let result;
  
  // Test 1: Class method finding
  console.log('--- Testing Class Method Finding ---');
  result = await extension.findMethod(rootPath, 'find_by_email', path.join(rootPath, 'app/models/user.rb'));
  console.log('Find class method "find_by_email":', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  // Test another class method
  result = await extension.findMethod(rootPath, 'published', path.join(rootPath, 'app/models/post.rb'));
  console.log('Find class method "published":', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  // Test 2: Association Navigation
  console.log('\n--- Testing Association Navigation ---');
  result = await extension.findAssociatedModel(rootPath, 'User', 'posts');
  console.log('Find "posts" association from User model:', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Association type: ${result.associationType}`);
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  result = await extension.findAssociatedModel(rootPath, 'Post', 'user');
  console.log('Find "user" association from Post model:', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Association type: ${result.associationType}`);
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  // Test 3: Rails Component Navigation
  console.log('\n--- Testing Rails Component Navigation ---');
  
  // Test mailer navigation
  result = await extension.findMailer(rootPath, 'User');
  console.log('Find UserMailer:', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  // Test concern navigation
  result = await extension.findConcern(rootPath, 'Authenticatable');
  console.log('Find Authenticatable concern:', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  // Test job navigation
  result = await extension.findJob(rootPath, 'UserNotification');
  console.log('Find UserNotificationJob:', result ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (result) {
    console.log(`  Location: ${path.basename(result.filePath)}:${result.line}`);
  }
  
  console.log('\n=== Tests Complete ===');
}

// Run the tests
console.log('Starting tests...');
runTests().catch(err => {
  console.error('Error running tests:', err);
});
