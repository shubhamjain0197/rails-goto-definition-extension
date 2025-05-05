const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Extensions of files to search
const RUBY_FILE_EXTENSIONS = ['.rb', '.rake', '.builder', '.jbuilder'];

/**
 * Helper function to escape special characters in a string for use in a regular expression
 * @param {string} string - String to escape
 * @returns {string} - Escaped string safe for regex
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Regular expressions for finding definitions
const PATTERNS = {
    CLASS: 'class\\s+([A-Z][\\w:]*)\\b',
    MODULE: 'module\\s+([A-Z][\\w:]*)\\b',
    // Allow methods with special characters like ? and !
    METHOD: '\\bdef\\s+([\\w_?!]+)\\b',
    // Allow class methods with special characters like ? and !
    CLASS_METHOD: '\\bdef\\s+self\\s*\\.\\s*([\\w_?!]+)\\b', // Class methods with def self.method_name
    ATTR: '\\battr_(?:accessor|reader|writer)\\s+:([\\w_?!]+)\\b',
    VARIABLE: '\\b([a-z_][a-zA-Z0-9_]*)\\b',
    METHOD_CALL: '\\b([a-z_][a-zA-Z0-9_?!]*)\\('   // Method calls with parentheses
};

/**
 * Find references to the word at cursor position in the current file only
 */
async function findReferencesInFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('No active editor');
        return;
    }

    const document = editor.document;
    if (document.languageId !== 'ruby') {
        vscode.window.showInformationMessage('Not a Ruby file');
        return;
    }

    const position = editor.selection.active;
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
        vscode.window.showInformationMessage('No word at cursor position');
        return;
    }

    const word = document.getText(wordRange);
    const currentFilePath = document.uri.fsPath;
    console.log(`Finding references to '${word}' in current file only`);

    try {
        // Call findAllReferences with currentFileOnly=true
        const references = await findAllReferences(word, currentFilePath, true);
        
        if (references && references.length > 0) {
            // Convert references to VS Code locations
            const locations = references.map(ref => {
                const uri = vscode.Uri.file(ref.filePath);
                const position = new vscode.Position(ref.line, ref.column);
                const range = new vscode.Range(position, position.translate(0, word.length));
                return new vscode.Location(uri, range);
            });

            // Show references in the references view
            await vscode.commands.executeCommand(
                'editor.action.showReferences',
                document.uri,
                position,
                locations
            );
            
            console.log(`Successfully showed ${references.length} references in current file`);
        } else {
            console.log(`No references found for: ${word} in current file`);
            vscode.window.showInformationMessage(`No references found for "${word}" in current file`);
        }
    } catch (error) {
        console.error('Error in find references in file command:', error);
        throw error;
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Rails Go To Definition extension is now active');
    
    // Register an event listener for when Ruby files are opened
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === 'ruby') {
                console.log('Ruby document opened, extension is ready for use');
            }
        })
    );
    
    /**
     * Handle find all references request
     */
    async function handleFindAllReferencesRequest() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active');
            return;
        }

        const position = editor.selection.active;
        const document = editor.document;
        const wordRange = document.getWordRangeAtPosition(position);
        
        if (!wordRange) {
            vscode.window.showInformationMessage('No word found at cursor position');
            return;
        }

        const word = document.getText(wordRange);
        if (!word || word.trim() === '') {
            vscode.window.showInformationMessage('Nothing selected');
            return;
        }
        
        console.log(`Finding references for word: '${word}'`);
        
        try {
            // Show progress while searching
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Searching for references to "${word}"...`,
                cancellable: true
            }, async (progress, token) => {
                // Make sure we have valid parameters before calling findAllReferences
                if (!word) {
                    console.error('Invalid word parameter for findAllReferences');
                    vscode.window.showErrorMessage('Error: Invalid search term');
                    return;
                }
                
                const references = await findAllReferences(word, document.fileName);
                
                if (!references || references.length === 0) {
                    vscode.window.showInformationMessage(`No references found for "${word}"`);
                    return;
                }
                
                // Create a list of locations
                const locations = references.map(ref => {
                    return new vscode.Location(
                        vscode.Uri.file(ref.filePath), 
                        new vscode.Position(ref.line, ref.column)
                    );
                });
                
                // Show references in the References panel
                await vscode.commands.executeCommand(
                    'editor.action.showReferences',
                    document.uri,
                    position,
                    locations
                );
                
                console.log(`Found ${references.length} references for "${word}"`);
            });
            
        } catch (error) {
            console.error('Error in findAllReferences command:', error);
            vscode.window.showErrorMessage(`Error finding references: ${error.message}`);
        }
    }
    
    /**
     * Handle navigation to associated models
     */
    async function handleAssociationNavigation() {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                console.log('No active editor found');
                return;
            }
            
            const document = editor.document;
            const position = editor.selection.active;
            const wordRange = document.getWordRangeAtPosition(position);
            
            if (!wordRange) {
                console.log('No word found at current position');
                vscode.window.showInformationMessage('No word found at current position');
                return;
            }
            
            const word = document.getText(wordRange);
            console.log(`Searching for association: ${word}`);
            
            // First, determine if we're in a model file
            const filename = path.basename(document.fileName);
            const isModelFile = document.fileName.includes('/app/models/') || 
                               filename.endsWith('.rb') && !filename.includes('_controller') && 
                               !filename.includes('_helper') && !filename.includes('_job');
            
            if (!isModelFile) {
                console.log('Not in a model file, cannot navigate to association');
                vscode.window.showInformationMessage('Association navigation only works in model files');
                return;
            }
            
            // Try to determine the current model name from the file path
            const modelName = path.basename(document.fileName, '.rb');
            if (!modelName) {
                console.log('Could not determine model name');
                vscode.window.showInformationMessage('Could not determine model name');
                return;
            }
            
            // Get workspace root
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                console.log('No workspace folder found');
                vscode.window.showInformationMessage('No workspace folder found');
                return;
            }
            
            const rootPath = workspaceFolders[0].uri.fsPath;
            
            // Find the associated model
            const association = await findAssociatedModel(rootPath, modelName, word);
            
            if (association) {
                console.log(`Found association: ${association.filePath}:${association.line} (${association.associationType})`);
                
                try {
                    const associationUri = vscode.Uri.file(association.filePath);
                    const associationDocument = await vscode.workspace.openTextDocument(associationUri);
                    
                    // Create position at line and character 0
                    const associationPosition = new vscode.Position(association.line, 0);
                    
                    // Navigate to the associated model
                    const associationEditor = await vscode.window.showTextDocument(associationDocument);
                    
                    // Set selection at position
                    associationEditor.selection = new vscode.Selection(associationPosition, associationPosition);
                    
                    // Show the line in the middle of the editor
                    associationEditor.revealRange(
                        new vscode.Range(associationPosition, associationPosition),
                        vscode.TextEditorRevealType.InCenter
                    );
                    
                    console.log('Successfully navigated to associated model');
                    vscode.window.showInformationMessage(`Navigated to ${association.associationType} association: ${word}`);
                } catch (docError) {
                    console.error('Error opening associated model document:', docError);
                    vscode.window.showErrorMessage(`Error opening associated model: ${docError.message}`);
                }
            } else {
                console.log(`No association found for: ${word}`);
                vscode.window.showInformationMessage(`No association found for "${word}"`);
            }
        } catch (error) {
            console.error('Error in association navigation command:', error);
            vscode.window.showErrorMessage(`Error navigating to association: ${error.message}`);
        }
    }
    
    // Common function to handle both go-to and peek definition requests
    async function handleDefinitionRequest(usePeek) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No editor is active');
            return;
        }

        const position = editor.selection.active;
        const document = editor.document;
        const wordRange = document.getWordRangeAtPosition(position);
        
        if (!wordRange) {
            vscode.window.showInformationMessage('No word found at cursor position');
            return;
        }

        const word = document.getText(wordRange);
        if (!word || word.trim() === '') {
            vscode.window.showInformationMessage('Nothing selected');
            return;
        }

        // Try to find the definition
        try {
            console.log(`Searching for definition of: ${word}`);
            
            const definition = await findRailsDefinition(word, document.fileName);
            
            if (definition) {
                console.log(`Definition found: ${definition.filePath}:${definition.line}`);
                
                // Show scope information if available (class/module the method belongs to)
                if (definition.scope) {
                    const scopeMessage = `Found '${word}' in ${definition.scope}`;
                    vscode.window.setStatusBarMessage(scopeMessage, 5000); // Show for 5 seconds
                    console.log(scopeMessage);
                }
                
                try {
                    const definitionUri = vscode.Uri.file(definition.filePath);
                    const definitionDocument = await vscode.workspace.openTextDocument(definitionUri);
                    
                    // Create position at line and character 0
                    const definitionPosition = new vscode.Position(definition.line, 0);
                    
                    if (usePeek) {
                        // Show the peek window
                        await vscode.commands.executeCommand(
                            'editor.action.peekLocations',
                            document.uri,
                            position,
                            [new vscode.Location(definitionUri, definitionPosition)],
                            'peek'
                        );
                        console.log('Successfully showed peek definition');
                    } else {
                        // Navigate to the definition
                        const editor = await vscode.window.showTextDocument(definitionDocument);
                        
                        // Set selection at position
                        editor.selection = new vscode.Selection(definitionPosition, definitionPosition);
                        
                        // Show the line in the middle of the editor
                        editor.revealRange(
                            new vscode.Range(definitionPosition, definitionPosition),
                            vscode.TextEditorRevealType.InCenter
                        );
                        
                        console.log('Successfully navigated to definition');
                    }
                } catch (docError) {
                    console.error('Error opening definition document:', docError);
                    vscode.window.showErrorMessage(`Error opening definition: ${docError.message}`);
                }
            } else {
                console.log(`No definition found for: ${word}`);
                vscode.window.showInformationMessage(`Could not find definition for "${word}"`);
            }
        } catch (error) {
            console.error('Error in definition command:', error);
            vscode.window.showErrorMessage(`Error finding definition: ${error.message}`);
        }
    }

    // Register the command to handle the right-click "Find Method Definition" option
    console.log('Registering rails-goto-definition.goToDefinition command');
    let disposable = vscode.commands.registerCommand('rails-goto-definition.goToDefinition', async function () {
        console.log('rails-goto-definition.goToDefinition command executed');
        await handleDefinitionRequest(false); // false means: don't use peek
    });

    // Register the command to handle the right-click "Peek Method Definition" option
    console.log('Registering rails-goto-definition.peekDefinition command');
    let peekDisposable = vscode.commands.registerCommand('rails-goto-definition.peekDefinition', async function () {
        console.log('rails-goto-definition.peekDefinition command executed');
        await handleDefinitionRequest(true); // true means: use peek
    });
    
    // Register the command to handle the right-click "Find All References" option
    console.log('Registering rails-goto-definition.findAllReferences command');
    let referencesDisposable = vscode.commands.registerCommand('rails-goto-definition.findAllReferences', async function () {
        try {
            await handleFindAllReferencesRequest();
        } catch (error) {
            console.error('Error in find all references command:', error);
            vscode.window.showErrorMessage(`Error finding references: ${error.message}`);
        }
    });

    let fileReferencesDisposable = vscode.commands.registerCommand('rails-goto-definition.findReferencesInFile', async function () {
        try {
            await findReferencesInFile();
        } catch (error) {
            console.error('Error in find references in file command:', error);
            vscode.window.showErrorMessage(`Error finding references in file: ${error.message}`);
        }
    });

    // Register the command to navigate to associated models
    console.log('Registering rails-goto-definition.goToAssociation command');
    let associationDisposable = vscode.commands.registerCommand('rails-goto-definition.goToAssociation', async function () {
        console.log('rails-goto-definition.goToAssociation command executed');
        await handleAssociationNavigation();
    });
    
    // Add commands to context subscriptions
    context.subscriptions.push(disposable);
    context.subscriptions.push(peekDisposable);
    context.subscriptions.push(referencesDisposable);
    context.subscriptions.push(fileReferencesDisposable);
    context.subscriptions.push(associationDisposable);
    
    console.log('Rails Go To Definition extension successfully registered commands');
    
    return {
        // Export any public API if needed
    };
}
/**
 * Find the definition of a Rails class, model, or method
 * @param {string} name - The name to find
 * @param {string} currentFilePath - The path of the file where the search was initiated
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findRailsDefinition(name, currentFilePath) {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showInformationMessage('No workspace folder found');
            return null;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        console.log(`Searching for '${name}' in project root: ${rootPath}`);
        
        // First, try the current file - highest priority for method definitions
        if (currentFilePath && fs.existsSync(currentFilePath)) {
            console.log(`Checking current file first: ${currentFilePath}`);
            const methodMatch = await findInFile(currentFilePath, name, 'method');
            if (methodMatch) {
                console.log(`Found method '${name}' in current file`);
                return methodMatch;
            }
            
            // Check for attr_accessor, attr_reader, attr_writer
            const attrMatch = await findInFile(currentFilePath, `\\battr_(?:accessor|reader|writer)\\s+:${name}\\b`, 'custom');
            if (attrMatch) {
                console.log(`Found attribute '${name}' in current file`);
                return attrMatch;
            }
        }

        // Next, based on naming analyze what we might be looking for
        let isPossibleClassName = false;
        let isPossibleMethodName = false;
        let searchTerm = name;
        
        // If name starts with capital letter, it's likely a class/module
        if (name.charAt(0) === name.charAt(0).toUpperCase() && name.charAt(0) !== name.charAt(0).toLowerCase()) {
            isPossibleClassName = true;
            console.log(`'${name}' appears to be a class or module name`);
        } else {
            // Likely a method name
            isPossibleMethodName = true;
            console.log(`'${name}' appears to be a method name`);
        }
        
        // Build search promises based on what we're looking for
        const searchPromises = [];
        
        if (isPossibleClassName) {
            // Standard class name searching
            searchPromises.push(findClass(rootPath, name));
            
            // Rails-specific conventions
            if (!name.endsWith('Controller') && !name.endsWith('Helper') && 
                !name.endsWith('Mailer') && !name.endsWith('Job')) {
                searchPromises.push(findModel(rootPath, name));
                searchPromises.push(findConcern(rootPath, name));
            }
            
            // Controllers
            if (name.endsWith('Controller') || !name.includes('Controller')) {
                searchPromises.push(findController(rootPath, name));
            }
            
            // Helpers
            if (name.endsWith('Helper') || !name.includes('Helper')) {
                searchPromises.push(findHelper(rootPath, name));
            }
            
            // Mailers
            if (name.endsWith('Mailer') || !name.includes('Mailer')) {
                searchPromises.push(findMailer(rootPath, name));
            }
            
            // Jobs
            if (name.endsWith('Job') || !name.includes('Job')) {
                searchPromises.push(findJob(rootPath, name));
            }
        }
        
        if (isPossibleMethodName) {
            // Look for method definitions throughout the project
            searchPromises.push(findMethod(rootPath, name, currentFilePath));
        }

        // Execute all searches in parallel
        console.log(`Executing ${searchPromises.length} search strategies for '${name}'`);
        const results = await Promise.all(searchPromises);
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length > 0) {
            console.log(`Found ${validResults.length} matches for '${name}', using first match`);
            return validResults[0];
        }
        
        console.log(`No definition found for '${name}'`);
        return null;
    } catch (error) {
        console.error('Error in findRailsDefinition:', error);
        return null;
    }
}

/**
 * Helper function to find a pattern in a file and return the line number and scope (class/module)
 * @param {string} filePath - Path to the file to search
 * @param {string} searchTerm - Term to search for
 * @param {string} type - Type of definition to search for ('class', 'module', 'method', 'class_method', or 'attr')
 * @returns {Promise<{filePath: string, line: number, scope?: string} | null>} - Returns file path, line, and scope (class/module) if applicable
 */
async function findInFile(filePath, searchTerm, type) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let pattern = '';
        
        // Select the appropriate regex pattern based on the type
        switch (type) {
            case 'class':
                pattern = PATTERNS.CLASS;
                break;
            case 'module':
                pattern = PATTERNS.MODULE;
                break;
            case 'method':
                pattern = PATTERNS.METHOD;
                break;
            case 'class_method':
                pattern = PATTERNS.CLASS_METHOD;
                break;
            case 'attr':
                pattern = PATTERNS.ATTR;
                break;
            default:
                // Custom pattern - assume searchTerm is already a regex pattern
                pattern = searchTerm;
        }

        let regex;

        // For method searches, we need to handle special characters like ? and ! carefully
        if (type === 'method' || type === 'class_method' || type === 'attr') {
            // Create a more specific pattern with word boundaries that allows special Ruby method characters
            const safeSearchTerm = escapeRegExp(searchTerm);
            console.log(`Searching for ${type} with name '${searchTerm}' (escaped: '${safeSearchTerm}')`);
            
            let regexPattern;
            
            // IMPORTANT: For methods with special characters like ?, we need simpler patterns
            if (type === 'method') {
                if (searchTerm.endsWith('?') || searchTerm.endsWith('!')) {
                    // DON'T use word boundaries for ? methods as they break the regex
                    // Just search for 'def method_name?' directly
                    regexPattern = `def\\s+${safeSearchTerm}`;
                } else {
                    regexPattern = `def\\s+${safeSearchTerm}\\b`;
                }
            } else if (type === 'class_method') {
                if (searchTerm.endsWith('?') || searchTerm.endsWith('!')) {
                    regexPattern = `def\\s+self\\s*\\.\\s*${safeSearchTerm}`;
                } else {
                    regexPattern = `def\\s+self\\s*\\.\\s*${safeSearchTerm}\\b`;
                }
            } else { // attr
                regexPattern = `attr_(?:accessor|reader|writer)\\s+:${safeSearchTerm}\\b`;
            }
            
            // Create the final regex - use case-insensitive for all patterns
            regex = new RegExp(regexPattern, 'i');
            
            // Output detailed logs for debugging
            console.log(`DEBUG - Using regex pattern: ${regexPattern}`);
            console.log(`DEBUG - Final regex object: ${regex.toString()}`);
            console.log(`DEBUG - File content length: ${content.length} bytes`);
            
            // Search the first 100 chars of content for debugging
            const previewContent = content.substring(0, Math.min(100, content.length));
            console.log(`DEBUG - Content preview: ${previewContent.replace(/\n/g, '\\n')}...`);
            
        } else if (type === 'class' || type === 'module') {
            // For classes/modules, look for an exact match of the name
            regex = new RegExp(pattern.replace('([A-Z][\\w:]*)', escapeRegExp(searchTerm)), 'i');
        } else {
            // Custom pattern
            regex = new RegExp(pattern, 'i');
        }
        
        const match = content.match(regex);
        
        if (match) {
            // Calculate line number
            const lineNumber = content.substring(0, match.index).split('\n').length - 1;
            
            // Detect scope (class/module) for methods
            let scope = null;
            if (type === 'method' || type === 'class_method' || type === 'attr') {
                // For methods, determine which class/module it belongs to
                // Look backwards in the content to find most recent class/module definition
                const contentUpToMatch = content.substring(0, match.index);
                
                // Find all class and module definitions before this method
                const classMatches = [...contentUpToMatch.matchAll(/class\s+([A-Z][\w:]*)/g)];
                const moduleMatches = [...contentUpToMatch.matchAll(/module\s+([A-Z][\w:]*)/g)];
                
                // Combine and sort by position
                const scopeMatches = [...classMatches, ...moduleMatches].sort((a, b) => b.index - a.index);
                
                if (scopeMatches.length > 0) {
                    // Get the closest scope before the method
                    const closestScope = scopeMatches[0];
                    scope = closestScope[1]; // Capture group for the class/module name
                    console.log(`Found method '${searchTerm}' in scope: ${scope}`);
                }
            }
            
            return { 
                filePath, 
                line: lineNumber,
                scope: scope // Will be null for non-method types or if no scope was found
            };
        }
    } catch (error) {
        console.error(`Error searching in file ${filePath}:`, error);
    }
    
    return null;
}

/**
 * Find a class definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} className - Class name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findClass(rootPath, className) {
    console.log(`Searching for class '${className}' in project`);
    
    // Search for the class in the app, lib, and other directories
    const classFiles = glob.sync(`{app,lib,config,test}/**/*.rb`, { cwd: rootPath });
    console.log(`Found ${classFiles.length} Ruby files to search for class '${className}'`);
    
    // First look for exact class name match
    const exactClassPattern = `class\\s+${className}\\b`;
    const exactModulePattern = `module\\s+${className}\\b`;
    
    for (const file of classFiles) {
        const filePath = path.join(rootPath, file);
        
        // Look for class definition
        const classMatch = await findInFile(filePath, exactClassPattern, 'custom');
        if (classMatch) {
            console.log(`Found class '${className}' in ${file}`);
            return classMatch;
        }
        
        // Look for module definition
        const moduleMatch = await findInFile(filePath, exactModulePattern, 'custom');
        if (moduleMatch) {
            console.log(`Found module '${className}' in ${file}`);
            return moduleMatch;
        }
    }
    
    // If no exact match found, check if the class name might be part of a namespace
    if (className.includes('::')) {
        // Handle namespaced classes (e.g., Admin::User)
        const nameParts = className.split('::');
        const simpleClassName = nameParts[nameParts.length - 1];
        const namespacePart = nameParts.slice(0, -1).join('::');
        
        const namespacedPattern = `class\\s+${simpleClassName}\\b`;
        
        for (const file of classFiles) {
            const filePath = path.join(rootPath, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if file contains the namespace AND the class
            if (content.includes(namespacePart) && content.match(new RegExp(namespacedPattern, 'i'))) {
                const match = content.match(new RegExp(namespacedPattern, 'i'));
                if (match) {
                    const lineNumber = content.substring(0, match.index).split('\n').length - 1;
                    console.log(`Found namespaced class '${className}' in ${file}`);
                    return { filePath, line: lineNumber };
                }
            }
        }
    }
    
    return null;
}

/**
 * Find a model definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} modelName - Model name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findModel(rootPath, modelName) {
    console.log(`Searching for model '${modelName}'`);
    
    // Try different naming conventions that Rails might use
    const possibleNames = [
        modelName,                      // Exact name
        modelName.toLowerCase(),        // Lowercase name
        inflectToSingular(modelName),   // Singular form
        inflectToPlural(modelName)      // Plural form
    ];
    
    // Look in standard Rails model locations
    for (const name of possibleNames) {
        const modelPath = path.join(rootPath, 'app/models', `${name.toLowerCase()}.rb`);
        console.log(`Checking model path: ${modelPath}`);
        
        if (fs.existsSync(modelPath)) {
            // Use pattern matching to find the class definition
            const modelDefinition = await findInFile(modelPath, `class\\s+${modelName}\\b`, 'custom');
            if (modelDefinition) {
                console.log(`Found model '${modelName}' in ${modelPath}`);
                return modelDefinition;
            }
            
            // If class name doesn't exactly match model, look for any class definition
            const anyClassDefinition = await findInFile(modelPath, PATTERNS.CLASS, 'custom');
            if (anyClassDefinition) {
                console.log(`Found model class definition in ${modelPath}`);
                return anyClassDefinition;
            }
            
            // If nothing found but file exists, return first line
            console.log(`Model file exists but no class definition found, returning first line: ${modelPath}`);
            return { filePath: modelPath, line: 0 };
        }
    }
    
    // Check unconventional locations - look through all ruby files
    console.log(`Model not found in conventional location, searching all Ruby files...`);
    const rubyFiles = glob.sync('app/**/*.rb', { cwd: rootPath });
    const modelPattern = `class\\s+${modelName}\\b`;
    
    for (const file of rubyFiles) {
        const filePath = path.join(rootPath, file);
        
        // Skip already checked model files
        if (filePath.includes('app/models/')) {
            continue;
        }
        
        const match = await findInFile(filePath, modelPattern, 'custom');
        if (match) {
            console.log(`Found model '${modelName}' in non-standard location: ${file}`);
            return match;
        }
    }
    
    return null;
}

/**
 * Helper function to attempt to convert a word to singular form
 * Enhanced implementation based on common Rails/ActiveSupport inflection rules
 */
function inflectToSingular(word) {
    if (!word) return word;
    
    // Already singular?
    if (!word.endsWith('s')) return word;
    
    // Handle irregular plurals
    const irregulars = {
        'people': 'person',
        'children': 'child',
        'men': 'man',
        'women': 'woman',
        'mice': 'mouse',
        'geese': 'goose',
        'feet': 'foot',
        'teeth': 'tooth',
        'oxen': 'ox',
        'vertices': 'vertex',
        'indices': 'index',
        'matrices': 'matrix',
        'aliases': 'alias',
        'statuses': 'status',
        'crises': 'crisis',
        'analyses': 'analysis',
        'diagnoses': 'diagnosis',
        'theses': 'thesis',
        'phenomena': 'phenomenon',
        'criteria': 'criterion',
        'data': 'datum'
    };
    
    const lowercaseWord = word.toLowerCase();
    if (irregulars[lowercaseWord]) {
        return irregulars[lowercaseWord];
    }
    
    // Handle common suffixes
    if (word.endsWith('ies')) {
        return word.slice(0, -3) + 'y';
    } else if (word.endsWith('ves')) {
        return word.slice(0, -3) + 'f';
    } else if (word.endsWith('xes') || word.endsWith('ches') || word.endsWith('sses') || word.endsWith('shes')) {
        return word.slice(0, -2);
    } else if (word.endsWith('es')) {
        if (word.endsWith('oes') && word.length > 3) {
            return word.slice(0, -2);
        }
        return word.slice(0, -1);
    } else if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('is')) {
        return word.slice(0, -1);
    }
    
    return word;
}

/**
 * Helper function to attempt to convert a word to plural form
 * Enhanced implementation based on common Rails/ActiveSupport inflection rules
 */
function inflectToPlural(word) {
    if (!word) return word;
    
    // Handle irregular plurals
    const irregulars = {
        'person': 'people',
        'child': 'children',
        'man': 'men',
        'woman': 'women',
        'mouse': 'mice',
        'goose': 'geese',
        'foot': 'feet',
        'tooth': 'teeth',
        'ox': 'oxen',
        'vertex': 'vertices',
        'index': 'indices',
        'matrix': 'matrices',
        'alias': 'aliases',
        'status': 'statuses',
        'crisis': 'crises',
        'analysis': 'analyses',
        'diagnosis': 'diagnoses',
        'thesis': 'theses',
        'phenomenon': 'phenomena',
        'criterion': 'criteria',
        'datum': 'data'
    };
    
    const lowercaseWord = word.toLowerCase();
    if (irregulars[lowercaseWord]) {
        return irregulars[lowercaseWord];
    }
    
    // Handle words that are already plural
    if ((word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) ||
        word.endsWith('ese') || word.endsWith('ose') || word.endsWith('ice')) {
        return word;
    }
    
    // Handle common suffix rules
    if (word.endsWith('y') && !isVowel(word.charAt(word.length - 2))) {
        return word.slice(0, -1) + 'ies';
    } else if (word.endsWith('f')) {
        return word.slice(0, -1) + 'ves';
    } else if (word.endsWith('fe')) {
        return word.slice(0, -2) + 'ves';
    } else if (word.endsWith('o') && !isVowel(word.charAt(word.length - 2))) {
        return word + 'es';
    } else if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || 
               word.endsWith('ch') || word.endsWith('sh')) {
        return word + 'es';
    } else if (word.endsWith('is')) {
        return word.slice(0, -2) + 'es';
    } else {
        return word + 's';
    }
}

/**
 * Helper function to check if a character is a vowel
 */
function isVowel(char) {
    return ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase());
}

/**
 * Find a controller definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} controllerName - Controller name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findController(rootPath, controllerName) {
    console.log(`Searching for controller '${controllerName}'`);
    
    // Determine the controller name format
    let searchName = controllerName;
    if (!controllerName.endsWith('Controller')) {
        searchName = `${controllerName}Controller`;
    }
    
    // Determine the file name (snake_case)
    const fileBaseName = searchName
        .replace(/Controller$/, '')
        .replace(/([A-Z])/g, (match, letter, offset) => {
            return (offset > 0 ? '_' : '') + letter.toLowerCase();
        });
    
    const controllerPath = path.join(rootPath, 'app/controllers', `${fileBaseName}_controller.rb`);
    console.log(`Checking controller path: ${controllerPath}`);
    
    if (fs.existsSync(controllerPath)) {
        // First look for exact class name match
        const controllerDefinition = await findInFile(controllerPath, `class\\s+${searchName}\\b`, 'custom');
        if (controllerDefinition) {
            console.log(`Found controller '${searchName}' in ${controllerPath}`);
            return controllerDefinition;
        }
        
        // If not found, look for any class definition
        const anyClassDefinition = await findInFile(controllerPath, PATTERNS.CLASS, 'custom');
        if (anyClassDefinition) {
            console.log(`Found controller class definition in ${controllerPath}`);
            return anyClassDefinition;
        }
        
        // If file exists but no definition found, return first line
        console.log(`Controller file exists but no class definition found, returning first line: ${controllerPath}`);
        return { filePath: controllerPath, line: 0 };
    }
    
    // Check for nested controllers (e.g., Admin::UsersController)
    if (controllerName.includes('::')) {
        const nameParts = controllerName.split('::');
        const namespace = nameParts.slice(0, -1).join('/');
        let className = nameParts[nameParts.length - 1];
        
        if (!className.endsWith('Controller')) {
            className += 'Controller';
        }
        
        const fileBaseName = className
            .replace(/Controller$/, '')
            .replace(/([A-Z])/g, (match, letter, offset) => {
                return (offset > 0 ? '_' : '') + letter.toLowerCase();
            });
        
        const nestedPath = path.join(rootPath, 'app/controllers', namespace.toLowerCase(), `${fileBaseName}_controller.rb`);
        console.log(`Checking nested controller path: ${nestedPath}`);
        
        if (fs.existsSync(nestedPath)) {
            const nestedDefinition = await findInFile(nestedPath, `class\\s+${nameParts.join('::')}\\b`, 'custom');
            if (nestedDefinition) {
                console.log(`Found nested controller '${controllerName}' in ${nestedPath}`);
                return nestedDefinition;
            }
            
            // If file exists but no definition found, return first line
            console.log(`Nested controller file exists but no class definition found, returning first line: ${nestedPath}`);
            return { filePath: nestedPath, line: 0 };
        }
    }
    
    // Search all controllers as a fallback
    console.log('Controller not found in conventional location, searching all controller files...');
    const controllerFiles = glob.sync('app/controllers/**/*.rb', { cwd: rootPath });
    
    for (const file of controllerFiles) {
        const filePath = path.join(rootPath, file);
        
        // Skip files we've already checked
        if (filePath === controllerPath) {
            continue;
        }
        
        const match = await findInFile(filePath, `class\\s+${searchName}\\b`, 'custom');
        if (match) {
            console.log(`Found controller '${searchName}' in non-standard location: ${file}`);
            return match;
        }
    }
    
    return null;
}

/**
 * Find a helper module definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} helperName - Helper name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findHelper(rootPath, helperName) {
    console.log(`Searching for helper '${helperName}'`);
    
    // Determine the helper name format
    let searchName = helperName;
    if (!helperName.endsWith('Helper')) {
        searchName = `${helperName}Helper`;
    }
    
    // Determine the file name (snake_case)
    const fileBaseName = searchName
        .replace(/Helper$/, '')
        .replace(/([A-Z])/g, (match, letter, offset) => {
            return (offset > 0 ? '_' : '') + letter.toLowerCase();
        });
    
    const helperPath = path.join(rootPath, 'app/helpers', `${fileBaseName}_helper.rb`);
    console.log(`Checking helper path: ${helperPath}`);
    
    if (fs.existsSync(helperPath)) {
        // First look for exact module name match
        const helperDefinition = await findInFile(helperPath, `module\\s+${searchName}\\b`, 'custom');
        if (helperDefinition) {
            console.log(`Found helper module '${searchName}' in ${helperPath}`);
            return helperDefinition;
        }
        
        // If not found, look for any module definition
        const anyModuleDefinition = await findInFile(helperPath, PATTERNS.MODULE, 'custom');
        if (anyModuleDefinition) {
            console.log(`Found helper module definition in ${helperPath}`);
            return anyModuleDefinition;
        }
        
        // If file exists but no definition found, return first line
        console.log(`Helper file exists but no module definition found, returning first line: ${helperPath}`);
        return { filePath: helperPath, line: 0 };
    }
    
    // Search all helpers as a fallback
    console.log('Helper not found in conventional location, searching all helper files...');
    const helperFiles = glob.sync('app/helpers/**/*.rb', { cwd: rootPath });
    
    for (const file of helperFiles) {
        const filePath = path.join(rootPath, file);
        
        // Skip files we've already checked
        if (filePath === helperPath) {
            continue;
        }
        
        const match = await findInFile(filePath, `module\\s+${searchName}\\b`, 'custom');
        if (match) {
            console.log(`Found helper module '${searchName}' in non-standard location: ${file}`);
            return match;
        }
    }
    
    // Check application_helper.rb for methods with the same name (common practice)
    const appHelperPath = path.join(rootPath, 'app/helpers/application_helper.rb');
    if (fs.existsSync(appHelperPath)) {
        // Look for method definition
        const methodDefinition = await findInFile(appHelperPath, `def\\s+${helperName.replace(/Helper$/, '')}\\b`, 'custom');
        if (methodDefinition) {
            console.log(`Found helper method '${helperName}' in application_helper.rb`);
            return methodDefinition;
        }
    }
    
    return null;
}

/**
 * Find a method definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} methodName - Method name to find
 * @param {string} currentFilePath - Current file path to prioritize context
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findMethod(rootPath, methodName, currentFilePath) {
    console.log(`Searching for method '${methodName}'`);
    
    // First check the current file for the method - highest priority
    if (currentFilePath && fs.existsSync(currentFilePath)) {
        console.log(`Checking current file first: ${currentFilePath}`);
        
        // Check for instance method
        const methodMatch = await findInFile(currentFilePath, methodName, 'method');
        if (methodMatch) {
            console.log(`Found instance method '${methodName}' in current file`);
            return methodMatch;
        }
        
        // Check for class method (def self.method_name)
        const classMethodMatch = await findInFile(currentFilePath, methodName, 'class_method');
        if (classMethodMatch) {
            console.log(`Found class method 'self.${methodName}' in current file`);
            return classMethodMatch;
        }
        
        // Check for attribute accessor
        const attrMatch = await findInFile(currentFilePath, methodName, 'attr');
        if (attrMatch) {
            console.log(`Found attribute '${methodName}' in current file`);
            return attrMatch;
        }
    }
    
    // Find candidate files to search in order of likelihood
    let candidateFiles = [];
    
    // 1. First check Rails conventional locations based on method name
    // Common Rails patterns
    const conventionalPatterns = [
        // Check models with matching name for CRUD methods
        { dir: 'app/models', pattern: `${inflectToSingular(methodName)}.rb` },
        { dir: 'app/models', pattern: `${inflectToPlural(methodName)}.rb` },
        
        // Check controllers with matching action name
        { dir: 'app/controllers', pattern: '**/*_controller.rb' },
        
        // Check helpers that might contain the method
        { dir: 'app/helpers', pattern: '**/*_helper.rb' },
        
        // Check services, concerns, lib
        { dir: 'app/services', pattern: '**/*.rb' },
        { dir: 'app/concerns', pattern: '**/*.rb' },
        { dir: 'lib', pattern: '**/*.rb' }
    ];
    
    // Create a map of paths to search
    for (const pattern of conventionalPatterns) {
        const patternPath = path.join(rootPath, pattern.dir);
        if (fs.existsSync(patternPath)) {
            const files = glob.sync(pattern.pattern, { cwd: patternPath });
            files.forEach(file => {
                const filePath = path.join(patternPath, file);
                if (filePath !== currentFilePath && !candidateFiles.includes(filePath)) {
                    candidateFiles.push(filePath);
                }
            });
        }
    }
    
    // 2. Then check all other Ruby files if needed
    const allRubyFiles = glob.sync('**/*.rb', { cwd: rootPath });
    allRubyFiles.forEach(file => {
        const filePath = path.join(rootPath, file);
        if (filePath !== currentFilePath && !candidateFiles.includes(filePath)) {
            candidateFiles.push(filePath);
        }
    });
    
    console.log(`Searching ${candidateFiles.length} files for method '${methodName}'`);
    
    // Search for both standard method definition and attr_* declarations
    for (const filePath of candidateFiles) {
        // Skip the current file as we've already checked it
        if (filePath === currentFilePath) continue;
        
        // Look for regular instance method definition
        const methodMatch = await findInFile(filePath, methodName, 'method');
        if (methodMatch) {
            console.log(`Found instance method '${methodName}' in ${filePath}`);
            return methodMatch;
        }
        
        // Look for class method definition (def self.method_name)
        const classMethodMatch = await findInFile(filePath, methodName, 'class_method');
        if (classMethodMatch) {
            console.log(`Found class method 'self.${methodName}' in ${filePath}`);
            return classMethodMatch;
        }
        
        // Attribute accessor/reader/writer
        const attrMatch = await findInFile(filePath, methodName, 'attr');
        if (attrMatch) {
            console.log(`Found attribute '${methodName}' in ${filePath}`);
            return attrMatch;
        }
    }
    
    console.log(`Method '${methodName}' not found in any file`);
    return null;
}

// Cache for file content and search results
const fileContentCache = new Map();
const referenceSearchCache = new Map();

/**
 * Find all references to a given word in the project or current file
 * @param {string} word - The word to find references for
 * @param {string} currentFilePath - The current file path
 * @param {boolean} currentFileOnly - Whether to search only in the current file
 * @returns {Promise<Array<{filePath: string, line: number, column: number}>>}
 */
async function findAllReferences(word, currentFilePath, currentFileOnly = false) {
    try {
        // Validate required parameters
        if (!word) {
            console.error('findAllReferences called with undefined or empty word parameter');
            return [];
        }
        // Check cache for previous searches
        const cacheKey = `${word}-${currentFileOnly ? 'file' : 'project'}-${currentFileOnly ? currentFilePath : ''}`;
        if (referenceSearchCache.has(cacheKey)) {
            console.log(`Using cached results for ${word}`);
            return referenceSearchCache.get(cacheKey);
        }
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [];
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        console.log(`Searching for references to '${word}' in project root: ${rootPath}`);
        
        // Determine which files to search
        let filesToSearch = [];
        if (currentFileOnly) {
            // Only search the current file
            const relativePath = path.relative(rootPath, currentFilePath);
            filesToSearch = [relativePath];
            console.log(`Searching only in current file: ${relativePath}`);
        } else {
            // Search all Ruby files in the project, excluding common binary and generated files
            filesToSearch = glob.sync('**/*.rb', { 
                cwd: rootPath,
                ignore: [
                    'node_modules/**',
                    'vendor/**',
                    'tmp/**',
                    'log/**',
                    'coverage/**',
                    'public/assets/**'
                ]
            });
            console.log(`Found ${filesToSearch.length} Ruby files to search`);
        }
        
        // Store all the references we find
        const references = [];
        
        // Create pattern to match the word - handle variables, methods, and classes differently
        let searchRegex;
        if (word.charAt(0) === word.charAt(0).toUpperCase()) {
            // Class or module name - be more specific with matching
            searchRegex = new RegExp(`\\b${word}\\b`, 'g');
        } else {
            // Method or variable - look for method calls, definitions, etc.
            searchRegex = new RegExp(`\\b${word}\\b(?!\\s*=)`, 'g');
        }
        
        // Create a progress counter
        let processed = 0;
        const total = filesToSearch.length;
        
        // Define batch size for parallel processing
        const BATCH_SIZE = 50;
        
        // Process files in batches to avoid blocking the UI
        for (let i = 0; i < filesToSearch.length; i += BATCH_SIZE) {
            const batch = filesToSearch.slice(i, i + BATCH_SIZE);
            
            // Process batch in parallel
            await Promise.all(batch.map(async (file) => {
                // Update progress
                processed++;
                if (processed % 20 === 0) {
                    console.log(`Processed ${processed}/${total} files...`);
                }
                
                const filePath = path.join(rootPath, file);
                if (!fs.existsSync(filePath)) {
                    return; // Skip this file
                }
                
                try {
                    // Skip large files
                    const stats = fs.statSync(filePath);
                    if (stats.size > 1024 * 1024) { // Skip files larger than 1MB
                        console.log(`Skipping large file: ${file} (${Math.round(stats.size / 1024)}KB)`);
                        return;
                    }
                    
                    // Use cached content if available
                    let content;
                    if (fileContentCache.has(filePath)) {
                        content = fileContentCache.get(filePath);
                    } else {
                        content = fs.readFileSync(filePath, 'utf8');
                        // Cache file content if not too large
                        if (content.length < 500000) { // ~500KB
                            fileContentCache.set(filePath, content);
                        }
                    }
                    
                    // Quick check if word exists in the file at all
                    if (!content.includes(word)) {
                        return; // Skip files that don't contain the word
                    }
                    
                    // Find all matches in the file
                    let match;
                    searchRegex.lastIndex = 0; // Reset regex index
                    
                    // Use a line-by-line approach to get accurate line and column numbers
                    const lines = content.split('\n');
                    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                        const line = lines[lineIndex];
                        searchRegex.lastIndex = 0; // Reset for each line
                        
                        while ((match = searchRegex.exec(line)) !== null) {
                            // Skip if it's part of a longer identifier
                            const prevChar = line[match.index - 1];
                            const nextChar = line[match.index + match[0].length];
                            
                            const isValidBoundary = (
                                (prevChar === undefined || !/[a-zA-Z0-9_]/.test(prevChar)) &&
                                (nextChar === undefined || !/[a-zA-Z0-9_]/.test(nextChar))
                            );
                            
                            if (isValidBoundary) {
                                references.push({
                                    filePath,
                                    line: lineIndex,
                                    column: match.index
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                }
            }));
            
            // Allow UI to refresh between batches
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        console.log(`Found ${references.length} references to '${word}'`);
        
        // Manage cache size
        if (fileContentCache.size > 100) {
            const keys = Array.from(fileContentCache.keys());
            for (let i = 0; i < 30; i++) { // Remove 30 oldest entries
                fileContentCache.delete(keys[i]);
            }
        }
        
        if (referenceSearchCache.size > 30) {
            const keys = Array.from(referenceSearchCache.keys());
            for (let i = 0; i < 10; i++) { // Remove 10 oldest entries
                referenceSearchCache.delete(keys[i]);
            }
        }
        
        // Cache this search result
        referenceSearchCache.set(cacheKey, references);
        
        return references;
    } catch (error) {
        console.error('Error in findAllReferences:', error);
        return [];
    }
}

/**
 * Find a mailer definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} mailerName - Mailer name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findMailer(rootPath, mailerName) {
    console.log(`Searching for mailer '${mailerName}'`);
    
    // Determine the mailer name format
    let searchName = mailerName;
    if (!mailerName.endsWith('Mailer')) {
        searchName = `${mailerName}Mailer`;
    }
    
    // Determine the file name (snake_case)
    const fileBaseName = searchName
        .replace(/Mailer$/, '')
        .replace(/([A-Z])/g, (match, letter, offset) => {
            return (offset > 0 ? '_' : '') + letter.toLowerCase();
        });
    
    const mailerPath = path.join(rootPath, 'app/mailers', `${fileBaseName}_mailer.rb`);
    console.log(`Checking mailer path: ${mailerPath}`);
    
    if (fs.existsSync(mailerPath)) {
        // First look for exact class name match
        const mailerDefinition = await findInFile(mailerPath, `class\\s+${searchName}\\b`, 'custom');
        if (mailerDefinition) {
            console.log(`Found mailer '${searchName}' in ${mailerPath}`);
            return mailerDefinition;
        }
        
        // If not found, look for any class definition
        const anyClassDefinition = await findInFile(mailerPath, PATTERNS.CLASS, 'custom');
        if (anyClassDefinition) {
            console.log(`Found mailer class definition in ${mailerPath}`);
            return anyClassDefinition;
        }
        
        // If file exists but no definition found, return first line
        console.log(`Mailer file exists but no class definition found, returning first line: ${mailerPath}`);
        return { filePath: mailerPath, line: 0 };
    }
    
    // Check if mailer is in the application_mailer.rb file
    const applicationMailerPath = path.join(rootPath, 'app/mailers/application_mailer.rb');
    if (fs.existsSync(applicationMailerPath)) {
        const mailerDefinition = await findInFile(applicationMailerPath, `class\\s+${searchName}\\b`, 'custom');
        if (mailerDefinition) {
            console.log(`Found mailer '${searchName}' in application_mailer.rb`);
            return mailerDefinition;
        }
    }
    
    // Look in non-standard locations
    const rubyFiles = glob.sync('app/**/*.rb', { cwd: rootPath });
    const mailerPattern = `class\\s+${searchName}\\b`;
    
    for (const file of rubyFiles) {
        // Skip already checked files
        if (file === `app/mailers/${fileBaseName}_mailer.rb` || file === 'app/mailers/application_mailer.rb') {
            continue;
        }
        
        const filePath = path.join(rootPath, file);
        const match = await findInFile(filePath, mailerPattern, 'custom');
        if (match) {
            console.log(`Found mailer '${searchName}' in non-standard location: ${file}`);
            return match;
        }
    }
    
    return null;
}

/**
 * Find a concern module definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} concernName - Concern name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findConcern(rootPath, concernName) {
    console.log(`Searching for concern '${concernName}'`);
    
    // Look in standard Rails concern locations
    const concernLocations = [
        'app/controllers/concerns',
        'app/models/concerns',
        'app/helpers/concerns'
    ];
    
    // Determine the file name (snake_case)
    const fileBaseName = concernName.replace(/([A-Z])/g, (match, letter, offset) => {
        return (offset > 0 ? '_' : '') + letter.toLowerCase();
    });
    
    // Look in all concern directories
    for (const location of concernLocations) {
        const concernPath = path.join(rootPath, location, `${fileBaseName}.rb`);
        console.log(`Checking concern path: ${concernPath}`);
        
        if (fs.existsSync(concernPath)) {
            // First look for module definition
            const moduleDefinition = await findInFile(concernPath, `module\\s+${concernName}\\b`, 'custom');
            if (moduleDefinition) {
                console.log(`Found concern module '${concernName}' in ${concernPath}`);
                return moduleDefinition;
            }
            
            // If not found as module, look for class definition
            const classDefinition = await findInFile(concernPath, `class\\s+${concernName}\\b`, 'custom');
            if (classDefinition) {
                console.log(`Found concern class '${concernName}' in ${concernPath}`);
                return classDefinition;
            }
            
            // If file exists but no definition found, return first line
            console.log(`Concern file exists but no module/class definition found, returning first line: ${concernPath}`);
            return { filePath: concernPath, line: 0 };
        }
    }
    
    // Look for concerns in non-standard locations
    const rubyFiles = glob.sync('app/**/*.rb', { cwd: rootPath });
    const concernPattern = `(?:module|class)\\s+${concernName}\\b`;
    
    for (const file of rubyFiles) {
        // Skip files we've already checked
        let skipFile = false;
        for (const location of concernLocations) {
            if (file === `${location}/${fileBaseName}.rb`) {
                skipFile = true;
                break;
            }
        }
        if (skipFile) continue;
        
        const filePath = path.join(rootPath, file);
        const match = await findInFile(filePath, concernPattern, 'custom');
        if (match) {
            console.log(`Found concern '${concernName}' in non-standard location: ${file}`);
            return match;
        }
    }
    
    return null;
}

/**
 * Find a job class definition in the project
 * @param {string} rootPath - Project root path
 * @param {string} jobName - Job name to find
 * @returns {Promise<{filePath: string, line: number} | null>}
 */
async function findJob(rootPath, jobName) {
    console.log(`Searching for job '${jobName}'`);
    
    // Determine the job name format
    let searchName = jobName;
    if (!jobName.endsWith('Job')) {
        searchName = `${jobName}Job`;
    }
    
    // Determine the file name (snake_case)
    const fileBaseName = searchName
        .replace(/Job$/, '')
        .replace(/([A-Z])/g, (match, letter, offset) => {
            return (offset > 0 ? '_' : '') + letter.toLowerCase();
        });
    
    const jobPath = path.join(rootPath, 'app/jobs', `${fileBaseName}_job.rb`);
    console.log(`Checking job path: ${jobPath}`);
    
    if (fs.existsSync(jobPath)) {
        // First look for exact class name match
        const jobDefinition = await findInFile(jobPath, `class\\s+${searchName}\\b`, 'custom');
        if (jobDefinition) {
            console.log(`Found job '${searchName}' in ${jobPath}`);
            return jobDefinition;
        }
        
        // If not found, look for any class definition
        const anyClassDefinition = await findInFile(jobPath, PATTERNS.CLASS, 'custom');
        if (anyClassDefinition) {
            console.log(`Found job class definition in ${jobPath}`);
            return anyClassDefinition;
        }
        
        // If file exists but no definition found, return first line
        console.log(`Job file exists but no class definition found, returning first line: ${jobPath}`);
        return { filePath: jobPath, line: 0 };
    }
    
    // Check if job is in the application_job.rb file
    const applicationJobPath = path.join(rootPath, 'app/jobs/application_job.rb');
    if (fs.existsSync(applicationJobPath)) {
        const jobDefinition = await findInFile(applicationJobPath, `class\\s+${searchName}\\b`, 'custom');
        if (jobDefinition) {
            console.log(`Found job '${searchName}' in application_job.rb`);
            return jobDefinition;
        }
    }
    
    // Look in non-standard locations
    const rubyFiles = glob.sync('app/**/*.rb', { cwd: rootPath });
    const jobPattern = `class\\s+${searchName}\\b`;
    
    for (const file of rubyFiles) {
        // Skip already checked files
        if (file === `app/jobs/${fileBaseName}_job.rb` || file === 'app/jobs/application_job.rb') {
            continue;
        }
        
        const filePath = path.join(rootPath, file);
        const match = await findInFile(filePath, jobPattern, 'custom');
        if (match) {
            console.log(`Found job '${searchName}' in non-standard location: ${file}`);
            return match;
        }
    }
    
    return null;
}

/**
 * Find an associated model based on relationship declarations
 * @param {string} rootPath - Project root path
 * @param {string} modelName - Source model name
 * @param {string} associationName - Association name to find
 * @returns {Promise<{filePath: string, line: number, associationType: string} | null>}
 */
async function findAssociatedModel(rootPath, modelName, associationName) {
    console.log(`Searching for association '${associationName}' from model '${modelName}'`);
    
    // First, find the model file
    const possibleNames = [
        modelName,
        modelName.toLowerCase(),
        inflectToSingular(modelName),
        inflectToPlural(modelName)
    ];
    
    let modelPath = null;
    let modelContent = null;
    
    // Try to find the model file
    for (const name of possibleNames) {
        const potentialPath = path.join(rootPath, 'app/models', `${name.toLowerCase()}.rb`);
        if (fs.existsSync(potentialPath)) {
            modelPath = potentialPath;
            modelContent = fs.readFileSync(potentialPath, 'utf8');
            break;
        }
    }
    
    if (!modelPath || !modelContent) {
        console.log(`Could not find model file for '${modelName}'`);
        return null;
    }
    
    // Define patterns for common association types
    const associationPatterns = [
        { type: 'belongs_to', pattern: `belongs_to\\s+:${associationName}\\b` },
        { type: 'has_many', pattern: `has_many\\s+:${associationName}\\b` },
        { type: 'has_one', pattern: `has_one\\s+:${associationName}\\b` },
        { type: 'has_and_belongs_to_many', pattern: `has_and_belongs_to_many\\s+:${associationName}\\b` }
    ];
    
    // Look for the association in the model file
    let associationType = null;
    let lineNumber = -1;
    
    for (const { type, pattern } of associationPatterns) {
        const regex = new RegExp(pattern, 'i');
        const match = modelContent.match(regex);
        
        if (match) {
            associationType = type;
            lineNumber = modelContent.substring(0, match.index).split('\n').length - 1;
            break;
        }
    }
    
    if (!associationType) {
        console.log(`No association '${associationName}' found in model '${modelName}'`);
        return null;
    }
    
    // Try to determine the target model class based on association type and Rails conventions
    let targetModelName = null;
    
    if (associationType === 'belongs_to') {
        // belongs_to uses singular form
        targetModelName = inflectToSingular(associationName);
        // If association is plural, Rails would singularize it internally
        targetModelName = targetModelName.charAt(0).toUpperCase() + targetModelName.slice(1);
    } else {
        // has_many, has_one, has_and_belongs_to_many use singular form of the target model
        targetModelName = inflectToSingular(associationName);
        // If association is plural, Rails would singularize it internally
        targetModelName = targetModelName.charAt(0).toUpperCase() + targetModelName.slice(1);
    }
    
    // Check for class_name option in the association
    const classNameMatch = modelContent.match(new RegExp(`${associationType}\\s+:${associationName}[^\\n]*class_name[^\\n]*["']([^"']+)["']`, 'i'));
    if (classNameMatch && classNameMatch[1]) {
        targetModelName = classNameMatch[1];
    }
    
    console.log(`Looking for target model: ${targetModelName}`);
    
    // Find the target model
    const targetModelMatch = await findModel(rootPath, targetModelName);
    if (targetModelMatch) {
        return {
            ...targetModelMatch,
            associationType
        };
    }
    
    return null;
}

function deactivate() {}

// For production usage, we only export activate and deactivate
module.exports = {
    activate,
    deactivate,
    // The following exports are for testing only
    findRailsDefinition,
    findInFile,
    findClass,
    findModel,
    findController,
    findHelper,
    findMethod,
    findAllReferences,
    findMailer,
    findConcern,
    findJob,
    findAssociatedModel,
    inflectToSingular,
    inflectToPlural,
    isVowel
};
