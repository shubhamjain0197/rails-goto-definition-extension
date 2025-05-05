const assert = require('assert');
const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs');

// Mock the vscode API using our common test helper
const extension = require('./test-helper');

describe('Rails Scopes', function() {
  let testExtension;
  
  before(function() {
    // Create mocks
    const fsReadMock = (path, encoding) => {
      if (path.includes('product.rb')) {
        return fs.readFileSync('./test/fixtures/app/models/product.rb', 'utf8');
      }
      return fs.readFileSync(path, encoding);
    };
    
    // Override fs.readFileSync with our mock
    const fsMock = {
      ...fs,
      readFileSync: fsReadMock,
      existsSync: (path) => true
    };
    
    // Load the extension with our specific file mocks
    testExtension = proxyquire('./test-helper', {
      'fs': fsMock
    });
  });
  
  describe('Scope Detection', function() {
    it('should find regular scope definitions', async function() {
      const result = await testExtension.findInFile(
        './test/fixtures/app/models/product.rb', 
        'active', 
        'scope'
      );
      
      assert.strictEqual(result.filePath, './test/fixtures/app/models/product.rb');
      assert.strictEqual(result.scope, 'Product');
    });
    
    it('should find scope with parameters', async function() {
      const result = await testExtension.findInFile(
        './test/fixtures/app/models/product.rb', 
        'matching_value', 
        'scope'
      );
      
      assert.strictEqual(result.filePath, './test/fixtures/app/models/product.rb');
      assert.strictEqual(result.scope, 'Product');
    });
    
    it('should find scope with whitespace after colon', async function() {
      const result = await testExtension.findInFile(
        './test/fixtures/app/models/product.rb', 
        'premium', 
        'scope'
      );
      
      assert.strictEqual(result.filePath, './test/fixtures/app/models/product.rb');
      assert.strictEqual(result.scope, 'Product');
    });
    
    it('should find scope with special characters', async function() {
      const result = await testExtension.findInFile(
        './test/fixtures/app/models/product.rb', 
        'discontinued?', 
        'scope'
      );
      
      assert.strictEqual(result.filePath, './test/fixtures/app/models/product.rb');
      assert.strictEqual(result.scope, 'Product');
    });
  });
  
  describe('Scope Search in findMethod', function() {
    it('should find scope via findMethod', async function() {
      // This test ensures the scope checks are properly integrated in findMethod
      const result = await testExtension.findMethod(
        './test/fixtures', 
        'matching_value',
        './test/fixtures/app/models/product.rb'
      );
      
      assert.strictEqual(result.filePath, './test/fixtures/app/models/product.rb');
      assert.strictEqual(result.scope, 'Product');
    });
  });
});
