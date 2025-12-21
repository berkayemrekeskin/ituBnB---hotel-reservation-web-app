import re
from flask_jwt_extended import get_jwt_identity
from bson.objectid import ObjectId

def serialize_doc(doc): # Helper function to serialize MongoDB documents
    if '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# NOTE: The following helper functions are added to support reservation validations
# TODO: Returns can be adjusted based on specific needs

def validate_date_format(date_str): # Helper function to validate date format
    # Simple check for YYYY-MM-DD format
    pattern = r'^\d{4}-\d{2}-\d{2}$'
    return re.match(pattern, date_str) is not None

def validate_reservation_dates(start_date, end_date): # Helper function to validate reservation date logic
    if not (validate_date_format(start_date) and validate_date_format(end_date)):
        return False
    return start_date <= end_date

def check_reservation_dates(data): # Combined validation for reservation dates
    if not validate_date_format(data['start_date']) or not validate_date_format(data['end_date']):
        return False
    if not validate_reservation_dates(data['start_date'], data['end_date']):
        return False
    return True

# NOTE: General validation function for both listings and reservations
# TODO: Returns can be adjusted based on specific needs

def check_validation(data, validations): # General validation function
    if data is None:
        return False
    for field, validator in validations.items():
        if field not in data or not validator(data[field]):
            return False
    return True

# NOTE: Helper function to check if current user is admin
def is_admin(db):
    current_user = get_jwt_identity()
    user = db.users.find_one({'username': current_user})
    return user and user.get('role') == 'admin'

# NOTE: Helper function to check if current user is host
def is_host(db):
    current_user = get_jwt_identity()
    user = db.users.find_one({'username': current_user})
    return user and user.get('role') == 'host'

# NOTE: Helper function to convert id string to ObjectId
def to_object_id(id_str):
    return ObjectId(id_str) if ObjectId.is_valid(id_str) else None


# NOTE: Helper function to validate review creation business logic
def validate_review_creation(db, data, current_user, reservation):
    """
    Validate business logic for review creation.
    Returns (is_valid, error_message)
    """
    # Check if reservation belongs to current user
    if reservation.get('user_id') != str(current_user['_id']):
        return False, 'You can only review your own reservations'
    
    # Check if reservation is completed
    if reservation.get('status') != 'completed':
        return False, 'You can only review completed reservations'
    
    # Verify property_id matches the reservation's property_id
    reservation_property_id = reservation.get('property_id')
    if reservation_property_id != data.get('property_id'):
        return False, 'Property ID does not match the reservation'
    
    # Verify property exists
    property_obj_id = to_object_id(data.get('property_id'))
    if property_obj_id:
        property_exists = db.listings.find_one({'_id': property_obj_id})
        if not property_exists:
            return False, 'Property not found'
    
    # Check if review already exists for this reservation
    existing_review = db.reviews.find_one({'reservation_id': str(reservation.get('_id'))})
    if existing_review:
        return False, 'Review already exists for this reservation'
    
    return True, None
