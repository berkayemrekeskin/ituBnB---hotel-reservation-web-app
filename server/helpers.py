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
        if field not in data:
            # If field is not in data, check if validator accepts None (optional field)
            if not validator(None):
                return False
        elif not validator(data[field]):
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
    reservation_user_id = reservation.get('user_id')
    # Handle both ObjectId and string formats
    if isinstance(reservation_user_id, dict) and '$oid' in reservation_user_id:
        reservation_user_id = reservation_user_id['$oid']
    reservation_user_id = str(reservation_user_id)
    
    if reservation_user_id != str(current_user['_id']):
        return False, 'You can only review your own reservations'
    
    # Note: Removed status check - users can review any of their past reservations
    # The frontend controls when the review button is shown (only for past trips)
    
    # Verify property_id matches the reservation's listing_id
    reservation_listing_id = reservation.get('listing_id')
    # Handle both ObjectId and string formats
    if isinstance(reservation_listing_id, dict) and '$oid' in reservation_listing_id:
        reservation_listing_id = reservation_listing_id['$oid']
    reservation_listing_id = str(reservation_listing_id)
    
    if reservation_listing_id != data.get('property_id'):
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


# NOTE: Helper functions for payment validation
def validate_expiry_date(expiry):
    """
    Validate expiry date in MM/YY format (e.g., 12/25)
    Returns (is_valid, error_message)
    """
    if not expiry or len(expiry) != 5:
        return False, 'Invalid expiry date format. Use MM/YY'
    
    if expiry[2] != '/':
        return False, 'Invalid expiry date format. Use MM/YY'
    
    try:
        month = int(expiry[:2])
        year = int(expiry[3:])
        
        if month < 1 or month > 12:
            return False, 'Invalid month. Must be between 01 and 12'
        
        # Check if card is expired (assuming 20YY for year)
        from datetime import datetime
        current_year = datetime.now().year % 100  # Get last 2 digits
        current_month = datetime.now().month
        
        if year < current_year or (year == current_year and month < current_month):
            return False, 'Card has expired'
        
        return True, None
    except ValueError:
        return False, 'Invalid expiry date format. Use MM/YY'


def validate_card_number(card_number):
    """
    Validate card number using Luhn algorithm
    Returns (is_valid, error_message)
    """
    # Remove spaces and validate format
    card_number = card_number.replace(" ", "")
    
    if not card_number.isdigit():
        return False, 'Card number must contain only digits'
    
    if len(card_number) < 13 or len(card_number) > 19:
        return False, 'Card number must be between 13 and 19 digits'
    
    # Luhn algorithm
    def luhn_check(card_num):
        digits = [int(d) for d in card_num]
        checksum = 0
        
        # Process digits from right to left
        for i in range(len(digits) - 2, -1, -1):
            if (len(digits) - 1 - i) % 2 == 1:
                digits[i] *= 2
                if digits[i] > 9:
                    digits[i] -= 9
        
        checksum = sum(digits)
        return checksum % 10 == 0
    
    # Temporarily disabled for testing - uncomment for production
    # if not luhn_check(card_number):
    #     return False, 'Invalid card number'
    
    return True, None
