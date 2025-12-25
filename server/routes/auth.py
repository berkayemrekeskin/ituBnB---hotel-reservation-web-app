from flask import Blueprint, request, jsonify
from db import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from validations import register_validations, login_validations, password_change_validations
from helpers import check_validation

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    db = get_db()
    data = request.json
    
    if not check_validation(data, register_validations):
        return jsonify({'error': 'Invalid data'}), 400
    
    name = data.get('name')
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already exists'}), 400
    if db.users.find_one({'username': username}):
        return jsonify({'error': 'Username already exists'}), 400
    
    hashed_password = generate_password_hash(password)
    db.users.insert_one({'name': name, 'email': email, 'username': username, 'password': hashed_password, 'role': "user", 'reservations': []})
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    db = get_db()
    data = request.json
    
    if not check_validation(data, login_validations):
        return jsonify({'error': 'Invalid data'}), 400
    
    username = data.get('username')
    password = data.get('password')

    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password'], password):
        access_token = create_access_token(identity=username) # NOTE: identity is selected as username. 
        user_id_str =   str(user['_id'])

        return jsonify(access_token=access_token, user_id=user_id_str, role=user.get('role', 'user')), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Generate an 8-digit verification code for password reset.
    Code is stored in database with 15-minute expiration.
    """
    import random
    from datetime import datetime, timedelta, timezone
    
    db = get_db()
    data = request.json
    
    username = data.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    
    # Check if user exists
    user = db.users.find_one({'username': username})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Generate 8-digit code
    code = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    
    # Store code with expiration (15 minutes)
    expiration = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Delete any existing codes for this user
    db.password_reset_codes.delete_many({'username': username})
    
    # Insert new code
    db.password_reset_codes.insert_one({
        'username': username,
        'code': code,
        'expires_at': expiration.isoformat()
    })
    
    # Return code (frontend will log to console)
    return jsonify({
        'message': 'Verification code generated',
        'code': code,
        'expires_in_minutes': 15
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset password using verification code.
    Requires username, code, and new_password.
    """
    from datetime import datetime, timezone
    
    db = get_db()
    data = request.json
    
    username = data.get('username')
    code = data.get('code')
    new_password = data.get('new_password')
    
    # Validate input
    if not all([username, code, new_password]):
        return jsonify({'error': 'All fields are required'}), 400
    
    # Find verification code
    reset_code = db.password_reset_codes.find_one({
        'username': username,
        'code': code
    })
    
    if not reset_code:
        return jsonify({'error': 'Invalid or expired verification code'}), 400
    
    # Check if code is expired
    expires_at = datetime.fromisoformat(reset_code['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        db.password_reset_codes.delete_one({'_id': reset_code['_id']})
        return jsonify({'error': 'Verification code has expired'}), 400
    
    # Verify user exists
    user = db.users.find_one({'username': username})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Update password
    new_hashed_password = generate_password_hash(new_password)
    db.users.update_one(
        {'username': username},
        {'$set': {'password': new_hashed_password}}
    )
    
    # Delete used code
    db.password_reset_codes.delete_one({'_id': reset_code['_id']})
    
    return jsonify({'message': 'Password reset successfully'}), 200
    
@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    db = get_db()
    data = request.json
    
    if not check_validation(data, password_change_validations):
        return jsonify({'error': 'Invalid data'}), 400
    
    username = data.get('username')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password'], old_password):
        new_hashed_password = generate_password_hash(new_password)
        db.users.update_one({'username': username}, {'$set': {'password': new_hashed_password}})
        return jsonify({'message': 'Password changed successfully'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

# NOTE: Account deletion route is commented out for safety reasons.

#@auth_bp.route('/delete-account', methods=['POST'])
#def delete_account():
#    db = get_db()
#    data = request.json
#    username = data.get('username')
#    password = data.get('password')
#
#    user = db.users.find_one({'username': username})
#    if user and check_password_hash(user['password'], password):
#        db.users.delete_one({'username': username})
#        return jsonify({'message': 'Account deleted successfully'}), 200
#    else:
#        return jsonify({'error': 'Invalid username or password'}), 401
