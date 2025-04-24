# Rails Go To Definition

A Visual Studio Code extension that helps Ruby on Rails developers navigate to class, model, and method definitions in their projects.

## Features

- Right-click on a word in a Ruby file and select "Go to Definition" to navigate to its definition
- Supports finding:
  - Model definitions (e.g., `User` model)
  - Controller definitions (e.g., `UsersController`)
  - Helper modules (e.g., `ApplicationHelper`) 
  - Standard Ruby class definitions
  - Method definitions

## Requirements

- Visual Studio Code 1.60.0 or higher
- A Ruby on Rails project

## Installation

### Development Setup

1. Clone this repository
2. Open the project in VS Code
3. Run `npm install` to install dependencies
4. Press F5 to launch the extension in debug mode

### Using the Extension

1. Open a Ruby on Rails project in VS Code
2. Open a Ruby file
3. Right-click on a class name, model name, or method name
4. Select "Go to Definition" from the context menu
5. The extension will navigate to the definition if found

## How It Works

The extension follows Rails conventions to locate definitions:

- For models, it looks in `app/models/[model_name].rb`
- For controllers, it looks in `app/controllers/[controller_name]_controller.rb`
- For helpers, it looks in `app/helpers/[helper_name]_helper.rb`
- For methods, it searches for `def method_name` in the current file and then in other files
- For general class definitions, it searches through Ruby files for `class ClassName` or `module ModuleName`

## Known Limitations

- This extension works best with standard Rails conventions
- It may not find definitions in non-conventional project structures
- Method searches might find multiple matches, and the extension will navigate to the first one found

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License.
