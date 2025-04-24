class Post < ApplicationRecord
  belongs_to :user
  has_many :comments
  
  validates :title, presence: true
  validates :content, presence: true
  
  def published?
    published_at.present?
  end
  
  def author_name
    user.full_name
  end
  
  def self.recent
    where('published_at > ?', 1.week.ago).order(published_at: :desc)
  end
end
