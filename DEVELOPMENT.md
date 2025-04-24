# Development Guide for Rails Go To Definition Extension

This guide explains how to test and develop the Rails Go To Definition extension with your Ruby on Rails project.

## Test the Extension in Development Mode

1. Open the extension project in VS Code:
   ```
   code /Users/home/CascadeProjects/rails-goto-definition-extension
   ```

2. Press `F5` or click the "Run and Debug" icon in the sidebar, then select "Extension" from the dropdown.

3. This will launch a new VS Code window with the extension running in development mode.

4. In the new window, open your Ruby on Rails project.

5. Open a Ruby file in your Rails project, right-click on a class or method name, and select "Go to Definition" from the context menu.

6. The extension will attempt to navigate to the definition based on Rails conventions.

## Debugging

- When running in development mode, the extension's console logs will appear in the Debug Console of the original VS Code window.
- You can add breakpoints in the extension code to debug specific functionality.
- Any changes made to the extension code will require restarting the debug session (press F5 again).

## Testing with Different Rails Projects

The extension works best with projects following standard Rails conventions:
- Models in `app/models/`
- Controllers in `app/controllers/`
- Helpers in `app/helpers/`

If your project uses non-standard paths, you may need to modify the extension code to support your specific project structure.
