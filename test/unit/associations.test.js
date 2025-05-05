/* eslint-env mocha */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const proxyquire = require('proxyquire').noCallThru();

// Mock VS Code API
const vscodeMock = {
    window: {
        showErrorMessage: () => {},
        showInformationMessage: () => {}
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
const fsMock = {
    ...fs,
    existsSync: (path) => {
        if (path.includes('app/models/user.rb') || 
            path.includes('app/models/post.rb') || 
            path.includes('app/models/comment.rb') ||
            path.includes('app/models/category.rb')) {
            return true;
        }
        return fs.existsSync(path);
    },
    readFileSync: (path, encoding) => {
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
        return fs.readFileSync(path, encoding);
    }
};

// Mock glob module
const globMock = {
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

// Import with mocked dependencies
const extension = proxyquire('../../extension', {
    'vscode': vscodeMock,
    'fs': fsMock,
    'glob': globMock
});

describe('Model Associations', function() {
    describe('findAssociatedModel', function() {
        it('should find a belongs_to association', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'Post',
                'user'
            );
            
            assert.strictEqual(result !== null, true);
            assert.strictEqual(result.associationType, 'belongs_to');
            assert.strictEqual(path.basename(result.filePath), 'user.rb');
        });
        
        it('should find a has_many association', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'User',
                'posts'
            );
            
            assert.strictEqual(result !== null, true);
            assert.strictEqual(result.associationType, 'has_many');
            assert.strictEqual(path.basename(result.filePath), 'post.rb');
        });
        
        it('should find a has_one association', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'User',
                'profile'
            );
            
            assert.strictEqual(result !== null, true);
            assert.strictEqual(result.associationType, 'has_one');
            assert.strictEqual(path.basename(result.filePath), 'profile.rb');
        });
        
        it('should find a has_and_belongs_to_many association', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'Post',
                'tags'
            );
            
            assert.strictEqual(result !== null, true);
            assert.strictEqual(result.associationType, 'has_and_belongs_to_many');
            assert.strictEqual(path.basename(result.filePath), 'tag.rb');
        });
        
        it('should handle class_name option in association', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'User',
                'team'
            );
            
            assert.strictEqual(result !== null, true);
            assert.strictEqual(result.associationType, 'belongs_to');
            assert.strictEqual(path.basename(result.filePath), 'organization.rb');
        });
        
        it('should return null for non-existent association', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'User',
                'nonexistent'
            );
            
            assert.strictEqual(result, null);
        });
        
        it('should return null for non-existent model', async function() {
            const result = await extension.findAssociatedModel(
                '/mock/workspace/root',
                'NonExistentModel',
                'posts'
            );
            
            assert.strictEqual(result, null);
        });
    });
    
    describe('Association Inflection', function() {
        it('should correctly inflect plurals to singulars', function() {
            assert.strictEqual(extension.inflectToSingular('posts'), 'post');
            assert.strictEqual(extension.inflectToSingular('categories'), 'category');
            assert.strictEqual(extension.inflectToSingular('people'), 'person');
        });
        
        it('should correctly inflect singulars to plurals', function() {
            assert.strictEqual(extension.inflectToPlural('post'), 'posts');
            assert.strictEqual(extension.inflectToPlural('category'), 'categories');
            assert.strictEqual(extension.inflectToPlural('person'), 'people');
        });
    });
});
