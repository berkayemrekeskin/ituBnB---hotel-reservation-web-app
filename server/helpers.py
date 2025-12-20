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