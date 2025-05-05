# Manual Testing Guide for Rails Go To Definition Enhancements

This guide provides steps to manually test the enhancements made to the Rails Go To Definition extension.

## Test Files Setup

We've created test files in the `test/fixtures/app` directory with various Rails components:

- Models: `User`, `Post`  
- Mailers: `UserMailer`
- Concerns: `Authenticatable`
- Jobs: `UserNotificationJob`

## Test 1: Class Method Navigation

1. Open `/test/fixtures/app/models/user.rb`
2. Place cursor on `self.find_by_email` and press F12 to navigate to definition
3. The extension should find and highlight the class method definition

Also test with:
- `self.published` in `post.rb`
- `self.send_to_all` in `user_mailer.rb`
- `self.schedule_for_all` in `user_notification_job.rb`

## Test 2: Association Navigation

1. Open `/test/fixtures/app/models/user.rb`
2. Place cursor on `posts` in the `has_many :posts` line
3. Use the command palette (Cmd+Shift+P) and run "Rails: Go To Associated Model"
4. The extension should navigate to the `Post` model

Also test with:
- `user` in `belongs_to :user` in `post.rb`
- `tags` in `has_and_belongs_to_many :tags` in `post.rb`

## Test 3: Rails Component Navigation

### Mailer Navigation:
1. Open any Ruby file
2. Use the command palette and search for "Rails: Go To Definition"
3. Enter `UserMailer`
4. The extension should navigate to the user_mailer.rb file

### Concern Navigation:
1. Open any Ruby file
2. Use the command palette and search for "Rails: Go To Definition"
3. Enter `Authenticatable`
4. The extension should navigate to the authenticatable.rb concern

### Job Navigation:
1. Open any Ruby file
2. Use the command palette and search for "Rails: Go To Definition"
3. Enter `UserNotificationJob`
4. The extension should navigate to the user_notification_job.rb file

## Extension Development Testing

If you're testing during development, you can:

1. Open the extension project in VS Code
2. Press F5 to start a new VS Code instance with the extension loaded
3. Open the test fixtures folder in the new VS Code window
4. Follow the steps above to verify functionality

## Reporting Issues

If you encounter any issues during testing, please report:
1. Which test case failed
2. The expected behavior
3. The actual behavior 
4. Any error messages shown in the developer console
