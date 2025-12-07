from flask import jsonify, request, Blueprint, Response
from db import get_db 
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity

reservation_bp = Blueprint('reservation', __name__, url_prefix='/api/reservations')

@reservation_bp.route("/", methods=["GET"])
@jwt_required()
def get_reservations():
    db = get_db()
    reservations = list(db.reservations.find({}))

    return Response(
        json_util.dumps(reservations),
        mimetype="application/json"
    )

@reservation_bp.route('/', methods=['POST'])
@jwt_required()
def create_reservation():
    db = get_db()
    data = request.json
    result = db.reservations.insert_one(data)
    return jsonify({'inserted_id': str(result.inserted_id)}), 201

@reservation_bp.route('/<reservation_id>', methods=['GET'])
@jwt_required()
def get_reservation(reservation_id):
    db = get_db()
    reservation = db.reservations.find_one({'reservation_id': int(reservation_id)})
    if reservation:
        return Response(
            json_util.dumps(reservation),
            mimetype="application/json"
        ) 
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/<reservation_id>', methods=['DELETE'])
@jwt_required()
def delete_reservation(reservation_id):
    db = get_db()
    result = db.reservations.delete_one({'reservation_id': int(reservation_id)})
    if result.deleted_count:
        return jsonify({'message': 'Reservation deleted'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/<reservation_id>', methods=['PUT'])
@jwt_required()
def update_reservation(reservation_id):
    db = get_db()
    data = request.json
    result = db.reservations.update_one({'_id': reservation_id}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Reservation updated'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
