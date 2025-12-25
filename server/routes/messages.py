from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity
from helpers import check_validation, to_object_id
from validations import messages_validations
from datetime import datetime, timezone

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')


def _get_username_from_token():
    # JWT'de sub = "user1" gibi geliyor
    return get_jwt_identity()


def _dm_conversation_id(user_a: str, user_b: str) -> str:
    """
    Aynı iki kullanıcı için her zaman aynı conversation_id üretir.
    Örn: dm:erginme21|user1
    """
    a, b = sorted([str(user_a), str(user_b)])
    return f"dm:{a}|{b}"


@messages_bp.route('/', methods=['POST'])
@jwt_required()
def create_message():
    db = get_db()
    data = request.json or {}

    sender_username = _get_username_from_token()
    receiver_username = data.get("receiver_username")
    content = data.get("content")

    # ✅ conversation_id artık otomatik üretilecek
    if not receiver_username or not content:
        return jsonify({
            "error": "Invalid data",
            "required": ["receiver_username", "content"],
            "got": list(data.keys())
        }), 400

    # ❌ Prevent self-messaging
    if sender_username == receiver_username:
        return jsonify({"error": "Cannot send messages to yourself"}), 400

    # receiver var mı kontrol et
    receiver_user = db.users.find_one({"username": receiver_username})
    if not receiver_user:
        return jsonify({"error": "Receiver user not found"}), 404

    # ❌ Validate user-host relationship via reservations
    # Get sender user
    sender_user = db.users.find_one({"username": sender_username})
    if not sender_user:
        return jsonify({"error": "Sender user not found"}), 404

    # Check if they have a reservation relationship
    # Either: sender is guest and receiver is host OR sender is host and receiver is guest
    has_relationship = db.reservations.find_one({
        "$or": [
            {
                "user_id": sender_user["_id"],
                "host_id": receiver_user["_id"]
            },
            {
                "user_id": receiver_user["_id"],
                "host_id": sender_user["_id"]
            }
        ]
    })

    if not has_relationship:
        return jsonify({
            "error": "You can only message hosts of your reservations or guests of your listings"
        }), 403

    conversation_id = _dm_conversation_id(sender_username, receiver_username)

    doc = {
        "sender_username": sender_username,
        "receiver_username": receiver_username,
        "conversation_id": conversation_id,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = db.messages.insert_one(doc)
    return jsonify({
        "_id": str(result.inserted_id),
        "conversation_id": conversation_id
    }), 201


@messages_bp.route('/<message_id>', methods=['GET'])
@jwt_required()
def get_message(message_id):
    db = get_db()
    _id = to_object_id(message_id)
    if not _id:
        return jsonify({'error': 'Invalid message ID'}), 400

    message = db.messages.find_one({'_id': _id})
    if message:
        return Response(json_util.dumps(message), mimetype="application/json")
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
    return jsonify({'error': 'Message not found'}), 404


@messages_bp.route('/<message_id>', methods=['PUT'])
@jwt_required()
def update_message(message_id):
    db = get_db()
    data = request.json or {}

    if not check_validation(data, messages_validations):
        return jsonify({'error': 'Invalid data'}), 400

    _id = to_object_id(message_id)
    if not _id:
        return jsonify({'error': 'Invalid message ID'}), 400

    # ✅ doğru şekilde ObjectId ile update
    result = db.messages.update_one({'_id': _id}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Message updated'})
    return jsonify({'error': 'Message not found'}), 404


@messages_bp.route("/", methods=["GET"])
@jwt_required()
def get_messages():
    db = get_db()
    messages = list(db.messages.find({}).sort("created_at", 1))
    return Response(json_util.dumps(messages), mimetype="application/json")


@messages_bp.route('/conversation/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation_messages(conversation_id):
    db = get_db()
    messages = list(db.messages.find({'conversation_id': str(conversation_id)}).sort("created_at", 1))
    return Response(json_util.dumps(messages), mimetype="application/json")


@messages_bp.route('/dm/<other_username>', methods=['GET'])
@jwt_required()
def get_dm_messages(other_username):
    """
    Login olan kullanıcı ile other_username arasındaki DM konuşmayı döner.
    Frontend conversation_id bilmek zorunda değil.
    """
    db = get_db()
    me = _get_username_from_token()
    conversation_id = _dm_conversation_id(me, other_username)

    messages = list(db.messages.find({'conversation_id': conversation_id}).sort("created_at", 1))
    return Response(json_util.dumps(messages), mimetype="application/json")


@messages_bp.route('/user/<username>', methods=['GET'])
@jwt_required()
def get_user_messages(username):
    db = get_db()
    messages = list(db.messages.find({
        "$or": [{"sender_username": username}, {"receiver_username": username}]
    }).sort("created_at", 1))

    return Response(json_util.dumps(messages), mimetype="application/json")


@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_available_conversations():
    """
    Get list of users that the current user can message.
    For guests: returns their hosts
    For hosts: returns their guests
    """
    db = get_db()
    current_username = _get_username_from_token()
    
    # Get current user
    current_user = db.users.find_one({"username": current_username})
    if not current_user:
        return jsonify({"error": "User not found"}), 404
    
    # Find all reservations where user is either guest or host
    reservations = list(db.reservations.find({
        "$or": [
            {"user_id": current_user["_id"]},  # User is guest
            {"host_id": current_user["_id"]}   # User is host
        ]
    }))
    
    # Collect unique user IDs that current user can message
    messageable_user_ids = set()
    for res in reservations:
        if res["user_id"] == current_user["_id"]:
            # Current user is guest, add host
            messageable_user_ids.add(res["host_id"])
        else:
            # Current user is host, add guest
            messageable_user_ids.add(res["user_id"])
    
    # Get user details and last message for each conversation
    conversations = []
    for user_id in messageable_user_ids:
        user = db.users.find_one({"_id": user_id})
        if not user:
            continue
            
        # Get last message in conversation
        conversation_id = _dm_conversation_id(current_username, user["username"])
        last_message = db.messages.find_one(
            {"conversation_id": conversation_id},
            sort=[("created_at", -1)]
        )
        
        conversations.append({
            "username": user["username"],
            "name": user.get("name", user["username"]),
            "last_message": {
                "content": last_message["content"] if last_message else None,
                "created_at": last_message["created_at"] if last_message else None,
                "sender_username": last_message["sender_username"] if last_message else None
            } if last_message else None
        })
    
    # Sort by last message time (most recent first)
    conversations.sort(
        key=lambda x: x["last_message"]["created_at"] if x["last_message"] else "",
        reverse=True
    )
    
    return Response(json_util.dumps(conversations), mimetype="application/json")

