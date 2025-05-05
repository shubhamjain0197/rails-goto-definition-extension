# Testing Guide for Rails Go To Definition Extension

This guide will help you test the enhanced features we've implemented in the Rails Go To Definition extension.

## Setting Up for Testing

### Loading the Extension in VS Code

1. Open VS Code
2. Open the extension project folder (File > Open Folder > Select `/Users/home/CascadeProjects/rails-goto-definition-extension`)
3. Press F5 to launch a new VS Code window with the extension loaded
   - If prompted, select "Extension Development Host"
   - This will open a new VS Code window with your extension loaded

### Preparing Test Files

We've already set up test files in the `/Users/home/CascadeProjects/rails-goto-definition-extension/test/fixtures/app` directory with:

- Models with associations: `user.rb` and `post.rb`
- Class methods: `self.find_by_email` and `self.published`
- Mailer: `user_mailer.rb`
- Concerns: `authenticatable.rb`
- Jobs: `user_notification_job.rb`

## Testing Individual Features

### 1. Class Method Finding

To test class method finding:

1. Open `/test/fixtures/app/models/user.rb` in the VS Code window with the extension loaded
2. Place your cursor on the word `find_by_email` in the `def self.find_by_email` line
3. Press F12 (Go to Definition) or right-click and select "Go to Definition"
4. The extension should navigate to the definition of the class method

Also try:
- Navigate to `self.published` in `post.rb`
- Navigate to `self.send_to_all` in `user_mailer.rb`
- Navigate to `self.schedule_for_all` in `user_notification_job.rb`

### 2. Association Navigation

To test association navigation:

1. Open `/test/fixtures/app/models/user.rb`
2. Place your cursor on the word `posts` in the `has_many :posts` line
3. Right-click and look for the "Go To Associated Model" command in the context menu
4. Click on it, and you should be navigated to the `Post` model

Also try:
- Navigate from `user` association in `post.rb` to the `User` model
- Navigate from `team` association with custom class name in `user.rb`

### 3. Rails Component Navigation

#### Testing Mailer Navigation:
1. Open any Ruby file
2. Press Ctrl+Shift+P (or Cmd+Shift+P on Mac) to open the command palette
3. Type "Rails: Go To Definition" and select it
4. Enter "UserMailer" and press Enter
5. You should be navigated to the `user_mailer.rb` file

#### Testing Concern Navigation:
1. Open the command palette
2. Select "Rails: Go To Definition"
3. Enter "Authenticatable" and press Enter
4. You should be navigated to the `authenticatable.rb` file

#### Testing Job Navigation:
1. Open the command palette
2. Select "Rails: Go To Definition"
3. Enter "UserNotificationJob"
4. You should be navigated to the `user_notification_job.rb` file

## Troubleshooting

If the navigation doesn't work as expected:

1. Check the VS Code Developer Console (Help > Toggle Developer Tools) for any error messages
2. Verify the extension is loaded (you should see "Rails Go To Definition extension is now active" in the Debug Console)
3. Make sure the test files exist in the correct locations
4. Try restarting the VS Code extension development host

## What to Look For

When testing, verify that:

1. The extension correctly identifies class methods (with `def self.method_name` syntax) 
2. Association navigation works for `belongs_to`, `has_many`, and other Rails associations
3. The extension can find mailers, concerns, and jobs in their respective directories
4. Error messages are appropriate when a definition can't be found

## Reporting Success or Issues

If you encounter any issues during testing:
1. Note which feature fails (class method finding, association navigation, or component finding)
2. Capture any error messages from the developer console
3. Document the steps to reproduce the issue

If all features work correctly, congratulations! The extension is now enhanced with powerful new capabilities for Rails developers.
