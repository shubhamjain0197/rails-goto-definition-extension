# Testing the Rails Go To Definition Extension

This guide will help you test the "Find Method Definition" functionality in the Rails Go To Definition extension.

## Testing Setup

1. First, open the extension project in VS Code:
   ```
   code /Users/home/CascadeProjects/rails-goto-definition-extension
   ```

2. Press F5 (or click on the Run and Debug icon and select "Extension") to launch a new VS Code window with the extension loaded.

3. In the new VS Code window, open the sample Rails project structure:
   ```
   code /Users/home/CascadeProjects/rails-goto-definition-extension/test/sample
   ```

## Sample Files for Testing

We've prepared several sample files that simulate a Rails project structure:

- **Models**: `/test/sample/app/models/user.rb`
- **Controllers**: `/test/sample/app/controllers/users_controller.rb`
- **Helpers**: `/test/sample/app/helpers/application_helper.rb`
- **Test File**: `/test/sample/test_file.rb` (references multiple components)

## Test Cases

Open the `/test/sample/test_file.rb` file and try the following test cases:

1. **Finding Model Definitions**:
   - Place your cursor on `User` (line 7 or 14)
   - Right-click and select "Find Method Definition"
   - It should navigate to the User model definition in `app/models/user.rb`

2. **Finding Controller Methods**:
   - Place your cursor on `user_params` (line 12)
   - Right-click and select "Find Method Definition"
   - It should find the method in `app/controllers/users_controller.rb`

3. **Finding Helper Methods**:
   - Place your cursor on `format_date` (line 21)
   - Right-click and select "Find Method Definition"
   - It should navigate to the method in `app/helpers/application_helper.rb`

4. **Finding Methods in Current File**:
   - Place your cursor on `valid?` in the TestClass (line 25)
   - Right-click and select "Find Method Definition"
   - It should navigate to the method definition in the same file

5. **Finding Methods in Other Files**:
   - Place your cursor on `valid?` inside the `@user.valid?` call (line 27)
   - Right-click and select "Find Method Definition"
   - It should go to the `valid?` method in the User model

## Debugging Tips

If the extension doesn't work as expected:

1. Check the Debug Console in the original VS Code window for any error messages
2. Verify that the extension is properly activated by opening a Ruby file
3. Make sure you're right-clicking on a valid identifier (class name, method name)

## What to Look For

When testing, pay attention to:

1. **Context menu item**: Verify it now shows "Find Method Definition" instead of "Go to Definition"
2. **Navigation accuracy**: Does it find the right definition?
3. **Performance**: How quickly does it find definitions?
4. **Error handling**: Does it show appropriate messages when definitions aren't found?

Remember that the extension performs pure string-based pattern matching, so it might occasionally find the wrong definition if there are multiple methods with the same name in your project.
