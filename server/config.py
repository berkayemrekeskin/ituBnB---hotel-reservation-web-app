# NOTE: This file contains validation rules for different data models.

listings_validations = {
    "title": lambda x: isinstance(x, str) and len(x) > 0,
    "description": lambda x: isinstance(x, str),
    "price_per_night": lambda x: isinstance(x, (int, float)) and x >= 0,
    "location": lambda x: isinstance(x, str) and len(x) > 0,
    "host_id": lambda x: isinstance(x, str) and len(x) > 0,
    "amenities": lambda x: isinstance(x, list) and all(isinstance(i, str) for i in x),
    "details": lambda x: isinstance(x, dict),
    "photos": lambda x: isinstance(x, list) and all(isinstance(i, str) for i in x),
}

reservations_validations = {
    "user_id": lambda x: isinstance(x, str) and len(x) > 0,
    "host_id": lambda x: isinstance(x, str) and len(x) > 0,
    "property_id": lambda x: isinstance(x, str) and len(x) > 0,
    "start_date": lambda x: isinstance(x, str), # Special validations for date strings will be in the route handlers
    "end_date": lambda x: isinstance(x, str),
    "total_price": lambda x: isinstance(x, (int, float)) and x >= 0,
    "status": lambda x: isinstance(x, str) and x in ["confirmed", "canceled", "completed"],
}

messages_validations = {
    "sender_id": lambda x: isinstance(x, str) and len(x) > 0,
    "receiver_id": lambda x: isinstance(x, str) and len(x) > 0,
    "conversation_id": lambda x: isinstance(x, str) and len(x) > 0,
    "content": lambda x: isinstance(x, str) and len(x) > 0,
    "timestamp": lambda x: isinstance(x, str),
}