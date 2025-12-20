from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required
from bson.objectid import ObjectId
from validations import messages_validations
from helpers import check_validation, to_object_id, is_admin, is_host

# MESSAGES TABLE
#------------------------------
# message_id: int -> Primary Key
# sender_id: int -> Foreign Key (references Users table)
# receiver_id: int -> Foreign Key (references Users table)
# conversation_id: int -> Foreign Key (references Conversations table)
# content: str -> content of the message

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

# NOTE: THESE ROUTES REQUIRE AUTHENTICATION
@messages_bp.route('/', methods=['POST'])
@jwt_required()
def create_message():
    db = get_db()
    data = request.json
   
    if not check_validation(data, messages_validations):
        return jsonify({'error': 'Invalid data'}), 400
    
    result = db.messages.insert_one(data)
    return jsonify({'_id': str(result.inserted_id)}), 201

@messages_bp.route('/<message_id>', methods=['GET'])
@jwt_required()
def get_message(message_id):
    db = get_db()
    
    _id = to_object_id(message_id)
    if not _id:
        return jsonify({'error': 'Invalid message ID'}), 400
    
    message = db.messages.find_one({'_id': _id})
    if message:
        return Response(
            json_util.dumps(message),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'Message not found'}), 404
    
@messages_bp.route('/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    db = get_db()
    
    _id = to_object_id(message_id)
    if not _id:
        return jsonify({'error': 'Invalid message ID'}), 400
    
    result = db.messages.delete_one({'_id': _id})
    if result.deleted_count:
        return jsonify({'message': 'Message deleted'})
    else:
        return jsonify({'error': 'Message not found'}), 404
    
@messages_bp.route('/<message_id>', methods=['PUT'])
@jwt_required()
def update_message(message_id):
    db = get_db()
    data = request.json
    
    if not check_validation(data, messages_validations):
        return jsonify({'error': 'Invalid data'}), 400
    
    _id = to_object_id(message_id)
    if not _id:
        return jsonify({'error': 'Invalid message ID'}), 400
    
    result = db.messages.update_one({'_id': message_id}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Message updated'})
    else:
        return jsonify({'error': 'Message not found'}), 404
    
@messages_bp.route("/", methods=["GET"])
@jwt_required()
def get_messages():
    db = get_db()
    messages = list(db.messages.find({}))
    
    return Response(
        json_util.dumps(messages),
        mimetype="application/json"
    )
    
@messages_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_user_messages(user_id):
    db = get_db()
    messages = list(db.messages.find({'user_id': int(user_id)}))
    
    return Response(
        json_util.dumps(messages),
        mimetype="application/json"
    )
    
@messages_bp.route('/conversation/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation_messages(conversation_id):
    db = get_db()
    messages = list(db.messages.find({'conversation_id': str(conversation_id)}))
    
    return Response(
        json_util.dumps(messages),
        mimetype="application/json"
    )