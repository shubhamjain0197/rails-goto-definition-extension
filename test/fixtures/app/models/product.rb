class Product < ApplicationRecord
  has_many :orders
  
  # Regular scopes
  scope :active, -> { where(active: true) }
  scope :featured, -> { where(featured: true) }
  
  # Scope with parameters
  scope :matching_value, ->(key, value) { where(name: key).where(value: value) }
  
  # Scope with whitespace after colon
  scope : premium, -> { where(price: 100..Float::INFINITY) }
  
  # Scope with special character
  scope :discontinued?, -> { where(discontinued: true) }
  
  def full_name
    "#{name} - #{sku}"
  end
  
  def self.find_by_sku(sku)
    where(sku: sku).first
  end
end
