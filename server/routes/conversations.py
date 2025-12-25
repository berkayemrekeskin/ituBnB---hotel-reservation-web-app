from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone

conversations_bp = Blueprint('conversations', __name__, url_prefix='/api/conversations')

@conversations_bp.route('/', methods=['GET'])
@jwt_required()
def get_my_conversations():
    """
    Get all conversations for the current user with user details and last message.
    Returns list of conversations with other user's info.
    """
    db = get_db()
    current_user = db.users.find_one({"username": get_jwt_identity()})
    if not current_user:
        return jsonify({"error": "User not found"}), 404
    
    # Find all conversations where user is sender or receiver
    conversations = list(db.conversations.find({
        "$or": [
            {"sender_id": current_user["_id"]},
            {"receiver_id": current_user["_id"]}
        ]
    }))
    
    # Enrich with user details and last message
    result = []
    for conv in conversations:
        # Determine the other user
        other_user_id = conv["receiver_id"] if conv["sender_id"] == current_user["_id"] else conv["sender_id"]
        other_user = db.users.find_one({"_id": other_user_id})
        
        if not other_user:
            continue
        
        # Get last message (using the DM conversation_id format from messages)
        # Since messages use username-based conversation_id, we need to construct it
        from routes.messages import _dm_conversation_id
        conversation_id = _dm_conversation_id(current_user["username"], other_user["username"])
        last_message = db.messages.find_one(
            {"conversation_id": conversation_id},
            sort=[("created_at", -1)]
        )
        
        result.append({
            "conversation_id": str(conv["_id"]),
            "username": other_user["username"],
            "name": other_user.get("name", other_user["username"]),
            "last_message": {
                "content": last_message["content"] if last_message else None,
                "created_at": last_message["created_at"] if last_message else None,
                "sender_username": last_message["sender_username"] if last_message else None
            } if last_message else None
        })
    
    # Sort by last message time
    result.sort(
        key=lambda x: x["last_message"]["created_at"] if x["last_message"] else "",
        reverse=True
    )
    
    return Response(json_util.dumps(result), mimetype="application/json")

@conversations_bp.route('/create', methods=['POST'])
@jwt_required()
def create_conversation():
    """
    Create or get existing conversation between current user and receiver.
    Validates reservation relationship exists.
    
    Request body: {"receiver_username": "username"}
    Returns: conversation object
    """
    db = get_db()
    data = request.json or {}
    receiver_username = data.get("receiver_username")
    
    if not receiver_username:
        return jsonify({"error": "receiver_username is required"}), 400
    
    # Get current user
    current_user = db.users.find_one({"username": get_jwt_identity()})
    if not current_user:
        return jsonify({"error": "Current user not found"}), 404
    
    # Get receiver user
    receiver_user = db.users.find_one({"username": receiver_username})
    if not receiver_user:
        return jsonify({"error": "Receiver user not found"}), 404
    
    # Prevent self-conversation
    if current_user["_id"] == receiver_user["_id"]:
        return jsonify({"error": "Cannot create conversation with yourself"}), 400
    
    # Validate reservation relationship
    has_relationship = db.reservations.find_one({
        "$or": [
            {"user_id": current_user["_id"], "host_id": receiver_user["_id"]},
            {"user_id": receiver_user["_id"], "host_id": current_user["_id"]}
        ]
    })
    
    if not has_relationship:
        return jsonify({
            "error": "You can only create conversations with hosts of your reservations or guests of your listings"
        }), 403
    
    # Check if conversation already exists (in either direction)
    existing_conversation = db.conversations.find_one({
        "$or": [
            {"sender_id": current_user["_id"], "receiver_id": receiver_user["_id"]},
            {"sender_id": receiver_user["_id"], "receiver_id": current_user["_id"]}
        ]
    })
    
    if existing_conversation:
        return Response(json_util.dumps(existing_conversation), mimetype="application/json"), 200
    
    # Create new conversation
    conversation_doc = {
        "sender_id": current_user["_id"],
        "receiver_id": receiver_user["_id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = db.conversations.insert_one(conversation_doc)
    conversation_doc["_id"] = result.inserted_id
    
    return Response(json_util.dumps(conversation_doc), mimetype="application/json"), 201

@conversations_bp.route('/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    db = get_db()
    conversation = db.conversations.find_one({"_id": conversation_id})
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    return Response(json_util.dumps(conversation), mimetype="application/json")

@conversations_bp.route('/<conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    db = get_db()
    conversation = db.conversations.find_one({"_id": conversation_id})
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    db.conversations.delete_one({"_id": conversation_id})
    return jsonify({"message": "Conversation deleted"}), 200

@conversations_bp.route('/messages/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation_messages(conversation_id):
    db = get_db()
    messages = db.messages.find({"conversation_id": conversation_id})
    return Response(json_util.dumps(messages), mimetype="application/json")

@conversations_bp.route('/messages/<conversation_id>', methods=['POST'])
@jwt_required()
def create_conversation_message(conversation_id):
    db = get_db()
    conversation = db.conversations.find_one({"_id": conversation_id})
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    
    user = db.users.find_one({"username": get_jwt_identity()})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    db.messages.insert_one({
        "conversation_id": conversation_id,
        "sender_id": user["_id"],
        "receiver_id": conversation["receiver_id"],
        "content": request.json["content"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return jsonify({"message": "Message created"}), 201

@conversations_bp.route('/messages/<message_id>', methods=['PUT'])
@jwt_required()
def update_conversation_message(message_id):
    db = get_db()
    message = db.messages.find_one({"_id": message_id})
    if not message:
        return jsonify({"error": "Conversation not found"}), 404
    
    user = db.users.find_one({"username": get_jwt_identity()})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    db.messages.update_one({"_id": conversation_id}, {"$set": {"content": request.json["content"]}})
    return jsonify({"message": "Message updated"}), 200


@conversations_bp.route('/messages/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation_message(message_id):
    db = get_db()
    message = db.messages.find_one({"_id": message_id})
    if not message:
        return jsonify({"error": "Conversation not found"}), 404
    
    user = db.users.find_one({"username": get_jwt_identity()})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    db.messages.delete_one({"_id": message_id})
    return jsonify({"message": "Message deleted"}), 200