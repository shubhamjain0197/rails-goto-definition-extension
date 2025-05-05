class UserNotificationJob < ApplicationJob
  queue_as :default
  
  def perform(user_id, notification_type)
    user = User.find(user_id)
    
    case notification_type
    when 'welcome'
      UserMailer.welcome_email(user).deliver_now
    when 'password_reset'
      token = generate_reset_token(user)
      UserMailer.password_reset(user, token).deliver_now
    end
  end
  
  def self.schedule_for_all(notification_type)
    User.find_each do |user|
      UserNotificationJob.perform_later(user.id, notification_type)
    end
  end
  
  private
  
  def generate_reset_token(user)
    SecureRandom.hex(10)
  end
end
