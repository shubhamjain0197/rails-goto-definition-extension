module ApplicationHelper
  def page_title(title)
    content_for :title, title
  end
  
  def format_date(date)
    date.strftime("%B %d, %Y")
  end
  
  def user_avatar(user)
    # Imagine this returns a user avatar
    "avatar.jpg"
  end
end
