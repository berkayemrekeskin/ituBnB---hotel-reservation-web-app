
from flask import Blueprint, request, Response, jsonify
from bson import ObjectId, json_util
from flask_jwt_extended import jwt_required, get_jwt_identity

from db import get_db 


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _ensure_admin(db, current_username):
    """
    Verify whether the current user has admin privileges.

    Expected user fields:
    - role = "admin"
    OR
    - is_admin = True

    Returns:
        True  -> user is admin
        False -> user is not admin
    """
    user = db.users.find_one({"username": current_username})
    if not user:
        return False

    # Admin logic (supports two different schemas)
    if user.get("role") == "admin":
        return True
    if user.get("is_admin") is True:
        return True

    return False


@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_all_users():
    """
    Get all users in the system (ADMIN ONLY).
    """
    db = get_db()
    current_user = get_jwt_identity()

    if not _ensure_admin(db, current_user):
        return jsonify({"msg": "Admin access required"}), 403

    users = list(db.users.find({}))
    return Response(
        json_util.dumps(users),
        mimetype="application/json"
    )


@admin_bp.route("/users/<user_id>", methods=["GET"])
@jwt_required()
def get_user_detail(user_id):
    """
    Get a single user's information (ADMIN ONLY).
    """
    db = get_db()
    current_user = get_jwt_identity()

    if not _ensure_admin(db, current_user):
        return jsonify({"msg": "Admin access required"}), 403

    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"msg": "Invalid user_id"}), 400

    user = db.users.find_one({"_id": obj_id})
    if not user:
        return jsonify({"msg": "User not found"}), 404

    return Response(
        json_util.dumps(user),
        mimetype="application/json"
    )


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    """
    Delete a user by ID (ADMIN ONLY).
    """
    db = get_db()
    current_user = get_jwt_identity()

    if not _ensure_admin(db, current_user):
        return jsonify({"msg": "Admin access required"}), 403

    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return jsonify({"msg": "Invalid user_id"}), 400

    result = db.users.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        return jsonify({"msg": "User not found"}), 404

    return jsonify({"msg": "User deleted successfully"}), 200


@admin_bp.route("/reservations", methods=["GET"])
@jwt_required()
def get_all_reservations():
    """
    Get all reservations in the system (ADMIN ONLY).
    """
    db = get_db()
    current_user = get_jwt_identity()

    if not _ensure_admin(db, current_user):
        return jsonify({"msg": "Admin access required"}), 403

    reservations = list(db.reservations.find({}))
    return Response(
        json_util.dumps(reservations),
        mimetype="application/json"
    )


@admin_bp.route("/reservations/<reservation_id>", methods=["DELETE"])
@jwt_required()
def delete_reservation(reservation_id):
    """
    Delete a reservation by ID (ADMIN ONLY).
    """
    db = get_db()
    current_user = get_jwt_identity()

    if not _ensure_admin(db, current_user):
        return jsonify({"msg": "Admin access required"}), 403

    try:
        obj_id = ObjectId(reservation_id)
    except Exception:
        return jsonify({"msg": "Invalid reservation_id"}), 400

    result = db.reservations.delete_one({"_id": obj_id})

    if result.deleted_count == 0:
        return jsonify({"msg": "Reservation not found"}), 404

    return jsonify({"msg": "Reservation deleted successfully"}), 200
