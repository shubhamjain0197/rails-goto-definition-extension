class User < ApplicationRecord
  validates :email, presence: true, uniqueness: true
  validates :username, presence: true
  
  has_many :posts
  has_many :comments
  
  attr_accessor :password_confirmation
  
  def full_name
    "#{first_name} #{last_name}"
  end
  
  def admin?
    role == 'admin'
  end
  
  def self.authenticate(email, password)
    user = find_by(email: email)
    return user if user && user.valid_password?(password)
    nil
  end
  
  private
  
  def valid_password?(password)
    password == self.password
  end
end
