# Rails Go To Definition

A Visual Studio Code extension that helps Ruby on Rails developers navigate to class, model, and method definitions in their projects, enhancing development productivity.

## Features

### Navigation Features

- **Find Method Definition**: Right-click on a word in a Ruby file and navigate directly to its definition
- **Peek Method Definition**: View a definition in a peek window without leaving your current file
- **Find All References**: Discover all occurrences of a method, class, or variable across your entire project
- **Find References in Current File**: Quickly locate all instances within just the current file

### Supported Elements

This extension helps you navigate to:

- Model definitions (e.g., `User` model)
- Controller definitions (e.g., `UsersController`)
- Helper modules (e.g., `ApplicationHelper`)
- Standard Ruby class definitions
- Method definitions (including methods with special characters like `?` and `!`)
- Rails model scopes (e.g., `scope :active`, `scope :offline_hours?`)
- Variable references

### Enhanced Features

- **Special Character Support**: Navigate to methods with `?` and `!` characters (e.g., `active?`, `save!`)
- **Scope Information**: When jumping to a method, see which class/module it belongs to in the status bar
- **Rails Scope Support**: Find and navigate to Rails model scope definitions

## Requirements

- Visual Studio Code 1.60.0 or higher
- A Ruby on Rails project

## Installation

### From VSIX Package

1. Download the latest `.vsix` file from the [releases page](https://github.com/shubhamjain0197/rails-goto-definition-extension/releases)
2. In VS Code, go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
3. Click the `...` menu in the top-right and select "Install from VSIX..."
4. Choose the downloaded `.vsix` file

### Development Setup

1. Clone this repository
2. Open the project in VS Code
3. Run `npm install` to install dependencies
4. Run `npm run build` to bundle the extension with webpack
5. Press F5 to launch the extension in debug mode

### Using the Extension

1. Open a Ruby on Rails project in VS Code
2. Open a Ruby file
3. Right-click on a class name, model name, method name, or variable
4. Choose one of the following options:
   - **Find Method Definition**: Navigate directly to the definition
   - **Peek Method Definition**: View the definition in a peek window
   - **Find All References**: See all occurrences across your project
   - **Find References in Current File**: See all occurrences in the current file only

## How It Works

### Navigation Logic

The extension uses string-based pattern matching to locate definitions, following Rails conventions:

- For models, it looks in `app/models/[model_name].rb`
- For controllers, it looks in `app/controllers/[controller_name]_controller.rb`
- For helpers, it looks in `app/helpers/[helper_name]_helper.rb`
- For methods, it searches for `def method_name` and `attr_accessor`, `attr_reader`, or `attr_writer` declarations
  - Includes special handling for methods with special characters like `?` and `!` (e.g., `offline_hours?`, `save!`)
- For Rails model scopes, it searches for `scope :[scope_name]` declarations in model files
- For general class definitions, it searches through Ruby files for `class ClassName` or `module ModuleName`

### Scope Detection

When navigating to definitions, the extension now provides scope information:

- When a method is found, the extension identifies which class or module contains it
- This scope information (e.g., `Found 'full_name' in User`) appears in the status bar
- For nested classes and modules, the full nesting path is shown

### Reference Finding

When finding references, the extension:

1. Scans for exact word matches with appropriate word boundaries
2. Handles different patterns based on whether it's a class, method, or variable
3. Presents all matches in the VS Code References panel for easy navigation

## Known Limitations

- This extension works best with standard Rails conventions
- It may not find definitions in non-conventional project structures
- Method searches might find multiple matches, and the extension will navigate to the first one found
- The extension is optimized for Ruby on Rails projects and may not work as well with other Ruby frameworks
- For very large projects, the "Find All References" feature may take some time to complete

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Fork the repository
2. Create your feature branch: `git checkout -b my-new-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request

## Version History

- **0.1.0**: Initial release with basic Go to Definition functionality
- **0.2.0**: Added Peek Method Definition feature and improved dependency management
- **0.3.0**: Added Find All References and Find References in Current File features
- **0.3.1**: Enhanced method detection with special character support (`?` and `!`), added scope information display, and added Rails model scope definition support

## License

This extension is licensed under the MIT License.
