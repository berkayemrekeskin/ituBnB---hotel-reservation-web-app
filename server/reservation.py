from flask import jsonify, request, Blueprint, Response
from db import get_db 
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from config import reservations_validations
from helpers import check_validation, check_reservation_dates

reservation_bp = Blueprint('reservation', __name__, url_prefix='/api/reservations')

# RESERVATION TABLE
#------------------------------
# _id: ObjectId -> Primary Key
# user_id: int -> Foreign Key (references Users table)
# host_id: int -> Foreign Key (references Hosts table)
# property_id: int -> Foreign Key (references Properties table)
# start_date: date
# end_date: date
# total_price: float -> total price of the reservation
# status: str -> status of the reservation (e.g., "confirmed", "canceled", "completed")

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

    # Validate data
    validation = check_validation(data, reservations_validations)
    date_validation = check_reservation_dates(data)
    if not validation or not date_validation:
        return jsonify({'error': 'Invalid data'}), 400
    
    result = db.reservations.insert_one(data)
    return jsonify({'_id': str(result.inserted_id)}), 201

@reservation_bp.route('/<reservation_id>', methods=['GET'])
@jwt_required()
def get_reservation(reservation_id):
    db = get_db()
    
    reservation_id_obj = ObjectId(reservation_id) if ObjectId.is_valid(reservation_id) else None
    if not reservation_id_obj:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    reservation = db.reservations.find_one({'_id': reservation_id_obj})
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
    reservation_id_obj = ObjectId(reservation_id) if ObjectId.is_valid(reservation_id) else None    
    
    if not reservation_id_obj:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    result = db.reservations.delete_one({'_id': reservation_id_obj})
    if result.deleted_count:
        return jsonify({'message': 'Reservation deleted'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/<reservation_id>', methods=['PUT'])
@jwt_required()
def update_reservation(reservation_id):
    db = get_db()
    data = request.json
    
    # Validate data
    validation = check_validation(data, reservations_validations)
    date_validation = check_reservation_dates(data)
    if not validation or not date_validation:
        return jsonify({'error': 'Invalid data'}), 400
    
    reservation_id = ObjectId(reservation_id) if ObjectId.is_valid(reservation_id) else None
    if not reservation_id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    result = db.reservations.update_one({'_id': reservation_id}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Reservation updated'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404