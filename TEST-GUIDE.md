# Testing Guide for Rails Go To Definition Extension

This guide provides detailed steps to troubleshoot and test the Rails Go To Definition extension.

## Testing Steps

### Method 1: Run Extension from VS Code

1. Open the extension project in VS Code:
   ```
   code /Users/home/CascadeProjects/rails-goto-definition-extension
   ```

2. In VS Code, press F5 or click the "Run and Debug" button in the sidebar.

3. Select "Extension" from the dropdown menu.

4. This launches a new VS Code window with the extension loaded.

5. In the Debug Console of the original window, check for any error messages.

6. In the new window, open either:
   - A real Ruby on Rails project, OR
   - The sample files we've created at `/Users/home/CascadeProjects/rails-goto-definition-extension/test/sample/`

7. Open one of the Ruby files, place your cursor on a class name like `User` or a method name.

8. Right-click and select "Go to Definition" from the context menu.

### Method 2: Manual Installation

If Method 1 doesn't work, try manually installing the extension:

1. Install the vsce packaging tool:
   ```
   npm install -g vsce@latest
   ```

2. Package the extension:
   ```
   cd /Users/home/CascadeProjects/rails-goto-definition-extension
   vsce package
   ```

3. This creates a `.vsix` file in the project directory.

4. In VS Code, go to Extensions view (Ctrl+Shift+X).

5. Click the "..." menu in the top-right of the Extensions view.

6. Select "Install from VSIX..." and choose the `.vsix` file created in step 2.

7. Restart VS Code and test the extension with Ruby files.

## Troubleshooting

If the extension still doesn't work, try these troubleshooting steps:

1. Check the Developer Tools console:
   - In the VS Code window where you're testing, press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac) to open Developer Tools.
   - Look for any error messages related to the extension.

2. Verify the extension is actually loaded:
   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Type "Extensions: Show Running Extensions"
   - Verify that "Rails Go To Definition" appears in the list

3. Try manually triggering the command:
   - Open the Command Palette
   - Type "Rails Go To Definition"
   - If the command doesn't appear, the extension is not being activated properly

## Testing with Sample Files

We've created sample files in the test/sample directory with a basic Rails project structure:

- `app/models/user.rb`: A simple User model
- `app/controllers/users_controller.rb`: A UsersController
- `app/helpers/application_helper.rb`: An ApplicationHelper module

These files follow Rails conventions and should work with the extension's definition finder.
