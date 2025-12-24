# NOTE: This file contains validation rules for different data models.
from bson.objectid import ObjectId

listings_validations = {
    "title": lambda x: isinstance(x, str) and len(x) > 0,
    "description": lambda x: isinstance(x, str),
    "price": lambda x: isinstance(x, (int, float)) and x >= 0,
    "city": lambda x: isinstance(x, str) and len(x) > 0,
    "property_type": lambda x: isinstance(x, str) and len(x) > 0,
    "host_id": lambda x: isinstance(x, (str, ObjectId)),
    "amenities": lambda x: isinstance(x, list) and all(isinstance(i, str) for i in x),
    "details": lambda x: isinstance(x, dict),
    "nearby": lambda x: isinstance(x, list) and all(isinstance(i, str) for i in x),
    "images": lambda x: isinstance(x, list) and all(isinstance(i, str) for i in x),
    "status": lambda x: isinstance(x, str) and x in ["pending", "approved", "declined"],
}

reservations_validations = {
    "user_id": lambda x: isinstance(x, str) and len(x) > 0,
    "host_id": lambda x: x is None or (isinstance(x, str) and len(x) > 0),  # Optional
    "listing_id": lambda x: isinstance(x, str) and len(x) > 0,
    "start_date": lambda x: isinstance(x, str), # Special validations for date strings will be in the route handlers
    "end_date": lambda x: isinstance(x, str),
    "total_price": lambda x: isinstance(x, (int, float)) and x >= 0,
    "guests": lambda x: isinstance(x, int) and x >= 0,
}

update_reservation_validations = {
    "status": lambda x: isinstance(x, str) and x in ["pending", "upcoming", "declined", "past", "unpaid"],
}

messages_validations = {
    "sender_id": lambda x: isinstance(x, str) and len(x) > 0,
    "receiver_id": lambda x: isinstance(x, str) and len(x) > 0,
    "conversation_id": lambda x: isinstance(x, str) and len(x) > 0,
    "content": lambda x: isinstance(x, str) and len(x) > 0,
}

user_validations = {
    "name": lambda x: isinstance(x, str) and len(x) > 0,
    "email": lambda x: isinstance(x, str) and "@" in x,
    "username": lambda x: isinstance(x, str) and len(x) > 0,
    "password": lambda x: isinstance(x, str) and len(x) >= 6,
    "reservations": lambda x: isinstance(x, list),
    "role": lambda x: isinstance(x, str) and x in ["user", "admin", "host"],
}

register_validations = {
    "name": lambda x: isinstance(x, str) and len(x) > 0,
    "email": lambda x: isinstance(x, str) and "@" in x,
    "username": lambda x: isinstance(x, str) and len(x) > 0,
    "password": lambda x: isinstance(x, str) and len(x) >= 6,
}

login_validations = {
    "username": lambda x: isinstance(x, str) and len(x) > 0,
    "password": lambda x: isinstance(x, str) and len(x) >= 6,
}

password_change_validations = {
    "username": lambda x: isinstance(x, str) and len(x) > 0,
    "old_password": lambda x: isinstance(x, str) and len(x) >= 6,
    "new_password": lambda x: isinstance(x, str) and len(x) >= 6,
}

review_validations = {
    "reservation_id": lambda x: isinstance(x, str) and len(x) > 0,
    "property_id": lambda x: isinstance(x, str) and len(x) > 0,
    "rating": lambda x: isinstance(x, (int, float)) and 1 <= x <= 5,
    "comment": lambda x: isinstance(x, str), 
}

search_validations = {
    "city": lambda x: isinstance(x, str) or x is None,
    "property_type": lambda x: isinstance(x, str) or x is None,
    "amenities": lambda x: isinstance(x, dict),
    "nearby": lambda x: isinstance(x, dict),
    "details": lambda x: isinstance(x, dict),
    "price": lambda x: isinstance(x, dict),
}

payment_validations = {
    "card_number": lambda x: isinstance(x, str) and len(x) > 0,
    "card_holder": lambda x: isinstance(x, str) and len(x) > 0 and len(x) <= 40,
    "expiry": lambda x: isinstance(x, str) and len(x) == 5,  # MM/YY format
    "cvv": lambda x: isinstance(x, str) and len(x) == 3 and x.isdigit(),
    "reservation_id": lambda x: isinstance(x, str) and len(x) > 0,
    "amount": lambda x: isinstance(x, (int, float)) and x > 0,
}
