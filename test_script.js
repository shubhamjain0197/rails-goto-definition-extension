const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the test sample directory
const testSampleDir = path.join(__dirname, 'test_sample');

console.log('Starting test for Rails Go To Definition extension...');
console.log('Test files are located in:', testSampleDir);

// Log the files we've created for testing
fs.readdirSync(testSampleDir).forEach(file => {
  if (file.endsWith('.rb')) {
    console.log(`- ${file}`);
  }
});

console.log('\nTo test the extension:');
console.log('1. Open VS Code');
console.log('2. Open the rails-goto-definition-extension folder');
console.log('3. Press F5 to start debugging (this will launch a new VS Code instance with the extension)');
console.log('4. In the new VS Code window, open the test_sample folder');
console.log('5. Open one of the Ruby files');
console.log('6. Right-click on method names, class names, or variables to test:');
console.log('   - "Find Method Definition"');
console.log('   - "Peek Method Definition"');
console.log('   - "Find All References"');

console.log('\nExample test cases:');
console.log('- In users_controller.rb: Right-click on "User" and try all three commands');
console.log('- In post_model.rb: Right-click on "full_name" method call and try the commands');
console.log('- In user_model.rb: Right-click on "authenticate" and try "Find All References"');

console.log('\nTest files ready for manual testing!');
