class UserMailer < ApplicationMailer
  def welcome_email
    @user = params[:user]
    mail(to: @user.email, subject: 'Welcome to My App!')
  end
  
  def password_reset
    @user = params[:user]
    @token = params[:token]
    mail(to: @user.email, subject: 'Password Reset Instructions')
  end
  
  def self.send_to_all(subject, body)
    User.find_each do |user|
      generic_email(user, subject, body).deliver_later
    end
  end
  
  def generic_email(user, subject, body)
    @user = user
    @body = body
    mail(to: user.email, subject: subject)
  end
end
