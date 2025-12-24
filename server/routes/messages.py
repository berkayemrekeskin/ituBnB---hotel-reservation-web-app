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

    # receiver var mı kontrol et
    if not db.users.find_one({"username": receiver_username}):
        return jsonify({"error": "Receiver user not found"}), 404

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
