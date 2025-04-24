# Distribution Guide for Rails Go To Definition Extension

This guide provides multiple methods to share your VS Code extension with others.

## Method 1: Share the Source Code (Easiest)

### Preparing the Extension

1. Create a ZIP archive of your extension's source code:

   ```bash
   cd /Users/home/CascadeProjects
   zip -r rails-goto-definition-extension.zip rails-goto-definition-extension
   ```

### Instructions for Recipients

Recipients should:

1. Download and extract the ZIP file
2. Open the folder in VS Code
3. Press F5 to run the extension in development mode
4. Test it with their Rails projects

## Method 2: Manual VSIX Creation on a Compatible System

If you have access to a system with Node.js v14 or newer:

1. Copy the extension folder to that system
2. Run:

   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

3. This will generate a `.vsix` file (e.g., `rails-goto-definition-0.2.0.vsix`)

### Installing the VSIX

Recipients can install the VSIX file by:

1. Opening VS Code
2. Going to Extensions view (Ctrl+Shift+X)
3. Clicking "..." (More Actions) > "Install from VSIX..."
4. Selecting the `.vsix` file

## Method 3: Installation from Local Folder

Recipients can also load your extension directly from its folder:

1. Copy the extension folder to their system
2. In VS Code, run:

   ```bash
   code --install-extension /path/to/rails-goto-definition-extension
   ```

   Or press Ctrl+Shift+P, type "Extensions: Install from Location...", and select the folder

## Method 4: Publishing to VS Code Marketplace (Future Option)

For wider distribution, consider publishing to the VS Code Marketplace:

1. Create a Microsoft account or GitHub account
2. Create a Personal Access Token (PAT)
3. Use `vsce publish` to publish the extension
4. Users can then install it directly from VS Code's Extensions view

## Extension Files to Share

When sharing the extension, make sure to include these essential files:

- `extension.js`: The main extension code
- `package.json`: Extension metadata and configuration
- `.vscodeignore`: Specifies which files to exclude
- `README.md`: Documentation for users
- `TESTING-GUIDE.md`: Guide for testing the extension
- Sample files in the `test/sample` directory for testing

## Current Extension Features

Remind recipients that this extension offers:

1. **Find Method Definition**: Navigate directly to method/class definitions
2. **Peek Method Definition**: View definitions in a peek window without leaving the current file
3. Pure string-based pattern matching (no Ruby language server required)
4. Support for Rails naming conventions and project structure
