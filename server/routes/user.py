from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity
from validations import user_validations
from helpers import check_validation, is_admin, to_object_id
from datetime import datetime

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

# USER TABLE
#------------------------------
# _id: ObjectId
# name: str
# email: str
# username: str
# role: str (user, admin, host)
# password: str (hashed)
# reservations: list of reservation_ids

# NOTE: THESE ROUTES REQUIRE AUTHENTICATION
@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    db = get_db()
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    user = db.users.find_one({'_id': _id})
    if user:
        return Response(
            json_util.dumps(user),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'User not found'}), 404

# Public endpoint to get username by user ID (for fetching host username)
@user_bp.route('/id/<user_id>/username', methods=['GET'])
def get_username_by_id(user_id):
    """Public endpoint to get username by user ID"""
    db = get_db()
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    user = db.users.find_one({'_id': _id}, {'username': 1})
    if user:
        return jsonify({'username': user['username']})
    return jsonify({'error': 'User not found'}), 404

# Get current user's profile with statistics
@user_bp.route('/profile/me', methods=['GET'])
@jwt_required()
def get_current_user_profile():
    """Get current user's profile with statistics"""
    db = get_db()
    current_username = get_jwt_identity()  # This returns username, not user_id
    
    # Get user data by username
    user = db.users.find_one({'username': current_username})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_id = user['_id']
    
    # Get statistics
    # Count trips (reservations)
    trip_count = db.reservations.count_documents({'user_id': user_id})
    
    # Count reviews written by user
    review_count = db.reviews.count_documents({'user_id': user_id})
    
    # Count listings if user is a host
    listing_count = 0
    if user.get('role') in ['host', 'admin']:
        listing_count = db.listings.count_documents({'host_id': user_id})
    
    # Build profile response
    profile = {
        '_id': user['_id'],
        'name': user.get('name', ''),
        'email': user.get('email', ''),
        'username': user.get('username', ''),
        'avatar': user.get('avatar', ''),
        'role': user.get('role', 'user'),
        'bio': user.get('bio', ''),
        'phone': user.get('phone', ''),
        'location': user.get('location', ''),
        'joinDate': user.get('created_at', datetime.now().isoformat()),
        'statistics': {
            'trips': trip_count,
            'reviews': review_count,
            'listings': listing_count
        }
    }
    
    return Response(
        json_util.dumps(profile),
        mimetype="application/json"
    )

# Update current user's profile
@user_bp.route('/profile/me', methods=['PUT'])
@jwt_required()
def update_current_user_profile():
    """Update current user's profile information"""
    db = get_db()
    current_username = get_jwt_identity()  # This returns username, not user_id
    data = request.json
    
    # Get user by username
    user = db.users.find_one({'username': current_username})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Only allow updating certain fields
    allowed_fields = ['name', 'email', 'bio', 'phone', 'location', 'avatar']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    # Update user
    result = db.users.update_one(
        {'username': current_username},
        {'$set': update_data}
    )
    
    if result.matched_count:
        # Return updated user data
        updated_user = db.users.find_one({'username': current_username})
        return Response(
            json_util.dumps(updated_user),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'User not found'}), 404
    
@user_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    db = get_db()
    data = request.json
    
    validation = check_validation(data, user_validations)
    if not validation:
        return jsonify({'error': 'Invalid data'}), 400
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    result = db.users.update_one({'_id': _id}, {'$set': data})

    if result.matched_count:
        return jsonify({'message': 'User updated'})
    else:
        return jsonify({'error': 'User not found'}), 404    

# NOTE:THESE ROUTES REQUIRE ADMIN PRIVILEGES
@user_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    db = get_db()
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    users = list(db.users.find({}))
    
    return Response(
        json_util.dumps(users),
        mimetype="application/json"
    )

@user_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    db = get_db()
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    result = db.users.delete_one({'_id': _id})
    if result.deleted_count:
        return jsonify({'message': 'User deleted'})
    else:
        return jsonify({'error': 'User not found'}), 404
    
@user_bp.route('/<user_id>/make-host', methods=['POST'])
@jwt_required()
def promote_user(user_id):
    db = get_db()
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    result = db.users.update_one({'_id': _id}, {'$set': {'role': 'host'}})
    if result.matched_count:
        return jsonify({'message': 'User promoted to host'})
    else:
        return jsonify({'error': 'User not found'}), 404
    
@user_bp.route('/<user_id>/make-user', methods=['POST'])
@jwt_required()
def demote_user(user_id):
    db = get_db()
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    result = db.users.update_one({'_id': _id}, {'$set': {'role': 'user'}})
    if result.matched_count:
        return jsonify({'message': 'User demoted to regular user'})
    else:
        return jsonify({'error': 'User not found'}), 404

