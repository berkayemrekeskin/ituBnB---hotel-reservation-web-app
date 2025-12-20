from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required
from validations import user_validations
from helpers import check_validation, is_admin, to_object_id

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


