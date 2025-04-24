class User
  attr_accessor :name, :email, :password
  
  def initialize(attributes = {})
    @name = attributes[:name]
    @email = attributes[:email]
    @password = attributes[:password]
  end
  
  def valid?
    @name.present? && @email.present? && @password.present?
  end
  
  def save
    # Imagine this saves to database
    true
  end
end
