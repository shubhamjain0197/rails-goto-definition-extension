class User < ApplicationRecord
  has_many :posts
  has_many :comments
  has_one :profile
  belongs_to :team, class_name: 'Organization'
  
  def full_name
    "#{first_name} #{last_name}"
  end
  
  def self.find_by_email(email)
    where(email: email).first
  end
  
  def self.active
    where(active: true)
  end
  
  attr_accessor :password
end
