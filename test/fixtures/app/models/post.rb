class Post < ApplicationRecord
  belongs_to :user
  has_many :comments
  has_and_belongs_to_many :tags
  
  def publish
    update(published_at: Time.current)
  end
  
  def self.published
    where.not(published_at: nil)
  end
end
