from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

@user_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    db = get_db()
    users = list(db.users.find({}))
    
    return Response(
        json_util.dumps(users),
        mimetype="application/json"
    )
    
@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    db = get_db()
    user = db.users.find_one({'user_id': int(user_id)})
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
    result = db.users.update_one({'user_id': int(user_id)}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'User updated'})
    else:
        return jsonify({'error': 'User not found'}), 404
    
