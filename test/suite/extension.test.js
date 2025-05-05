const assert = require('assert');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const extension = require('../../extension');

/* global suite, test, suiteSetup */

// Helper function to create a mock vscode editor with a document
function createMockTextEditor(fileName, content, position = new vscode.Position(0, 0)) {
  const uri = vscode.Uri.file(fileName);
  const document = {
    uri: uri,
    fileName: fileName,
    getText: () => content,
    getWordRangeAtPosition: () => new vscode.Range(position, new vscode.Position(position.line, position.character + 5)),
    languageId: 'ruby',
    lineAt: (line) => ({
      text: content.split('\n')[line]
    }),
    positionAt: () => position
  };
  
  return {
    document: document,
    selection: {
      active: position
    }
  };
}

// Mock context for testing
const mockContext = {
  subscriptions: [],
  workspaceState: {
    get: () => undefined,
    update: () => Promise.resolve()
  },
  globalState: {
    get: () => undefined,
    update: () => Promise.resolve()
  }
};

suite('Extension Test Suite', () => {
  let mockEditor;
  
  suiteSetup(() => {
    vscode.window.showInformationMessage('Starting extension tests');
    extension.activate(mockContext);
    
    // Create test fixtures
    const testFixturesPath = path.resolve(__dirname, '../fixtures');
    if (!fs.existsSync(testFixturesPath)) {
      fs.mkdirSync(testFixturesPath, { recursive: true });
    }
    
    // Create test Ruby files
    const modelContent = `
      class User < ApplicationRecord
        has_many :posts
        
        def full_name
          "#{first_name} #{last_name}"
        end
        
        def self.find_by_email(email)
          where(email: email).first
        end
        
        attr_accessor :password
      end
    `;
    
    const controllerContent = `
      class UsersController < ApplicationController
        def index
          @users = User.all
        end
        
        def show
          @user = User.find(params[:id])
        end
        
        def create
          @user = User.new(user_params)
          if @user.save
            redirect_to @user
          else
            render :new
          end
        end
        
        private
        
        def user_params
          params.require(:user).permit(:email, :password)
        end
      end
    `;
    
    fs.writeFileSync(path.join(testFixturesPath, 'user.rb'), modelContent);
    fs.writeFileSync(path.join(testFixturesPath, 'users_controller.rb'), controllerContent);
    
    // Create mock editor
    mockEditor = createMockTextEditor(
      path.join(testFixturesPath, 'user.rb'),
      modelContent,
      new vscode.Position(3, 7) // Position at the "full_name" method
    );
    
    // Mock the active editor
    vscode.window.activeTextEditor = mockEditor;
  });
  
  test('Extension should be properly imported', () => {
    assert.ok(typeof extension.activate === 'function', 'activate function exists');
    assert.ok(typeof extension.deactivate === 'function', 'deactivate function exists');
  });
  
  test('Extension should register commands', () => {
    assert.ok(mockContext.subscriptions.length > 0, 'Should register at least one command');
  });
  
  test('findRailsDefinition function should exist', () => {
    assert.ok(typeof extension.findRailsDefinition === 'function', 'findRailsDefinition function exists');
  });
  
  test('findInFile function should exist', () => {
    assert.ok(typeof extension.findInFile === 'function', 'findInFile function exists');
  });
  
  test('findClass function should exist', () => {
    assert.ok(typeof extension.findClass === 'function', 'findClass function exists');
  });
  
  test('findModel function should exist', () => {
    assert.ok(typeof extension.findModel === 'function', 'findModel function exists');
  });
  
  test('findController function should exist', () => {
    assert.ok(typeof extension.findController === 'function', 'findController function exists');
  });
  
  test('findMethod function should exist', () => {
    assert.ok(typeof extension.findMethod === 'function', 'findMethod function exists');
  });
  
  test('findAllReferences function should exist', () => {
    assert.ok(typeof extension.findAllReferences === 'function', 'findAllReferences function exists');
  });
  
  test('inflection helpers should exist', () => {
    assert.ok(typeof extension.inflectToSingular === 'function', 'inflectToSingular function exists');
    assert.ok(typeof extension.inflectToPlural === 'function', 'inflectToPlural function exists');
  });
  
  // Add tests for the inflection helper functions
  test('inflectToSingular function should convert words correctly', () => {
    // Test basic plural to singular conversion
    assert.strictEqual(extension.inflectToSingular('users'), 'user');
    assert.strictEqual(extension.inflectToSingular('posts'), 'post');
    
    // Test irregular plurals
    // assert.strictEqual(extension.inflectToSingular('children'), 'child');
    
    // Test already singular words
    assert.strictEqual(extension.inflectToSingular('user'), 'user');
  });
  
  test('inflectToPlural function should convert words correctly', () => {
    // Test basic singular to plural conversion
    assert.strictEqual(extension.inflectToPlural('user'), 'users');
    assert.strictEqual(extension.inflectToPlural('post'), 'posts');
    
    // Test already plural words
    assert.strictEqual(extension.inflectToPlural('users'), 'users');
  });
});
