from flask import jsonify, request, Blueprint
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from validations import payment_validations
from helpers import check_validation, validate_expiry_date, validate_card_number, to_object_id
from datetime import datetime
import hashlib

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')

# PAYMENT TABLE SCHEMA
#------------------------------
# _id: ObjectId -> Primary Key
# user_id: str -> Foreign Key (references Users table)
# reservation_id: str -> Foreign Key (references Reservations table)
# card_holder: str -> Name on card (encrypted)
# card_last_four: str -> Last 4 digits of card
# amount: float -> Payment amount
# status: str -> Payment status (e.g., "success", "failed", "pending")
# transaction_id: str -> Unique transaction identifier
# created_at: datetime -> Payment timestamp

@payment_bp.route('/process', methods=['POST'])
@jwt_required()
def process_payment():
    """
    Process payment for a reservation
    Expected payload:
    {
        "card_number": "1234567890123456",
        "card_holder": "John Doe",
        "expiry": "12/25",
        "cvv": "123",
        "reservation_id": "reservation_object_id",
        "amount": 1500.00
    }
    """
    db = get_db()
    data = request.json
    current_user = get_jwt_identity()

    
    # Validate basic data structure
    if not check_validation(data, payment_validations):
        return jsonify({'error': 'Invalid payment data'}), 400
    
    # Validate expiry date (MM/YY format)
    is_valid_expiry, expiry_error = validate_expiry_date(data['expiry'])
    if not is_valid_expiry:
        return jsonify({'error': expiry_error}), 400
    
    # Validate card number using Luhn algorithm
    is_valid_card, card_error = validate_card_number(data['card_number'])
    if not is_valid_card:
        return jsonify({'error': card_error}), 400
    
    # Verify reservation exists
    reservation_id = to_object_id(data['reservation_id'])
    if not reservation_id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    reservation = db.reservations.find_one({'_id': reservation_id})
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    # Get user info
    user = db.users.find_one({'username': current_user})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    

    str_id = str(user['_id'])
    str_user_id = str(reservation.get('user_id'))

    if str_id != str_user_id:
        return jsonify({'error': 'Unauthorized to pay for this reservation'}), 403
    
    # Check if payment already exists for this reservation
    existing_payment = db.payments.find_one({'reservation_id': str(reservation_id)})
    if existing_payment and existing_payment.get('status') == 'success':
        return jsonify({'error': 'Payment already processed for this reservation'}), 400
    
    # Process payment (in a real app, this would integrate with a payment gateway)
    # For now, we'll simulate a successful payment
    
    # Extract last 4 digits of card
    card_number_clean = data['card_number'].replace(" ", "")
    card_last_four = card_number_clean[-4:]
    
    # Hash sensitive data (card holder name)
    card_holder_hash = hashlib.sha256(data['card_holder'].encode()).hexdigest()
    
    # Generate transaction ID
    transaction_id = hashlib.sha256(
        f"{current_user}{data['reservation_id']}{datetime.now().isoformat()}".encode()
    ).hexdigest()[:16]
    
    # Create payment record
    payment_data = {
        'user_id': str(user['_id']),
        'reservation_id': str(reservation_id),
        'card_holder_hash': card_holder_hash,
        'card_last_four': card_last_four,
        'amount': data['amount'],
        'status': 'success',  # In production, this would depend on payment gateway response
        'transaction_id': transaction_id,
        'created_at': datetime.now(),
    }
    
    result = db.payments.insert_one(payment_data)
    
    # Update reservation status to confirmed after successful payment
    db.reservations.update_one(
        {'_id': reservation_id},
        {'$set': {'status': 'confirmed', 'payment_id': str(result.inserted_id)}}
    )
    
    return jsonify({
        'message': 'Payment processed successfully',
        'transaction_id': transaction_id,
        'payment_id': str(result.inserted_id),
        'status': 'success'
    }), 201


@payment_bp.route('/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get payment details by payment ID"""
    db = get_db()
    current_user = get_jwt_identity()
    
    _id = to_object_id(payment_id)
    if not _id:
        return jsonify({'error': 'Invalid payment ID'}), 400
    
    payment = db.payments.find_one({'_id': _id})
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    # Get user info
    user = db.users.find_one({'username': current_user})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify the payment belongs to the current user
    if payment.get('user_id') != str(user['_id']):
        return jsonify({'error': 'Unauthorized to view this payment'}), 403
    
    return jsonify({
        '_id': str(payment['_id']),
        'reservation_id': payment['reservation_id'],
        'card_last_four': payment['card_last_four'],
        'amount': payment['amount'],
        'status': payment['status'],
        'transaction_id': payment['transaction_id'],
        'created_at': payment['created_at'].isoformat() if isinstance(payment['created_at'], datetime) else payment['created_at']
    }), 200


@payment_bp.route('/reservation/<reservation_id>', methods=['GET'])
@jwt_required()
def get_payment_by_reservation(reservation_id):
    """Get payment details by reservation ID"""
    db = get_db()
    current_user = get_jwt_identity()
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    payment = db.payments.find_one({'reservation_id': str(_id)})
    if not payment:
        return jsonify({'error': 'Payment not found for this reservation'}), 404
    
    # Get user info
    user = db.users.find_one({'username': current_user})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify the payment belongs to the current user
    if payment.get('user_id') != str(user['_id']):
        return jsonify({'error': 'Unauthorized to view this payment'}), 403
    
    return jsonify({
        '_id': str(payment['_id']),
        'reservation_id': payment['reservation_id'],
        'card_last_four': payment['card_last_four'],
        'amount': payment['amount'],
        'status': payment['status'],
        'transaction_id': payment['transaction_id'],
        'created_at': payment['created_at'].isoformat() if isinstance(payment['created_at'], datetime) else payment['created_at']
    }), 200
