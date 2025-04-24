# Testing Rails Go To Definition v0.3.0

This guide will help you test the new "Find All References" feature along with the existing "Find Method Definition" and "Peek Method Definition" features.

## Method 1: Testing with Development Mode

### 1. Start Debugging Session
1. Open the rails-goto-definition-extension folder in VS Code
2. Press F5 (or Run > Start Debugging)
3. This will launch a new VS Code window with the extension loaded

### 2. Open Test Files
1. In the new VS Code window, open the `test_sample` folder
2. Browse the sample Ruby files we created:
   - `user_model.rb`
   - `post_model.rb`
   - `users_controller.rb`

### 3. Test the Features
Here are specific test cases for each feature:

#### Find Method Definition
1. Open `users_controller.rb`
2. Right-click on any `User` reference
3. Select "Find Method Definition"
4. It should navigate to the `User` class in `user_model.rb`

#### Peek Method Definition
1. Open `post_model.rb`
2. Right-click on `full_name` in the `author_name` method
3. Select "Peek Method Definition"
4. A peek window should open showing the `full_name` method from `user_model.rb`

#### Find All References (New Feature)
1. Open `user_model.rb`
2. Right-click on `authenticate` method
3. Select "Find All References"
4. The References panel should open showing all occurrences of `authenticate` in the project

## Method 2: Install the VSIX Package Manually

### 1. Locate the VSIX File
The packaged extension is located at:
```
/Users/home/CascadeProjects/rails-goto-definition-extension/rails-goto-definition-0.3.0.vsix
```

### 2. Install in VS Code
1. Open VS Code
2. Click on the Extensions view icon on the sidebar (or press Ctrl+Shift+X)
3. Click on the "..." menu in the top-right of the Extensions view
4. Select "Install from VSIX..."
5. Navigate to and select the VSIX file

### 3. Verify Installation
- Check that "Rails Go To Definition" appears in your installed extensions list
- The version should be 0.3.0

## Common Issues & Troubleshooting

If you encounter any issues:

1. **Extension Not Loading**: Check the Output panel (View > Output, select "Extension Host") for any error messages

2. **Features Not Working**: Try reloading the window (Developer: Reload Window from the command palette)

3. **No References Found**: Make sure you're right-clicking on a valid identifier and that your workspace has multiple references to it

4. **Performance Issues**: For large projects, the "Find All References" feature may take some time. Watch for the progress notification.

## Feedback and Improvements

Keep track of any issues you encounter or suggestions for improvements. Key points to evaluate:

- Speed of finding references in large projects
- Accuracy of the references found
- User experience of the References panel
- Integration with the existing features
