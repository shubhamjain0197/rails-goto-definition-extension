
      class User < ApplicationRecord
        has_many :posts
        
        def full_name
          "#{first_name} #{last_name}"
        end
        
        def self.find_by_email(email)
          where(email: email).first
        end
        
        attr_accessor :password
      end
    