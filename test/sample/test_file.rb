# This is a test file to demonstrate the Rails Go To Definition extension
# Try placing your cursor on various elements and use the "Find Method Definition" context menu

# Class that references User model
class TestClass
  def initialize
    @user = User.new(name: "Test User")
  end
  
  # Method that calls user_params from UsersController
  def create_user
    user_params = { name: "New User", email: "test@example.com" }
    @user = User.new(user_params)
    @user.save
  end
  
  # Method that uses a helper method
  def format_user_date(date)
    # This should find format_date in ApplicationHelper
    formatted = format_date(date)
    return formatted
  end
  
  # Try finding this method definition
  def valid?
    # This should go to User#valid? method
    @user.valid?
  end
end

# Try right-clicking on:
# - User (should go to app/models/user.rb)
# - user_params (should find the method in app/controllers/users_controller.rb)
# - format_date (should find the method in app/helpers/application_helper.rb)
# - valid? (could go to the local method or the User model method)
