from flask import jsonify, request, Blueprint, Response
from db import get_db 
from bson import json_util
from flask_jwt_extended import jwt_required
from bson.objectid import ObjectId
from validations import reservations_validations, update_reservation_validations
from helpers import check_validation, check_reservation_dates, to_object_id, is_host, is_admin

reservation_bp = Blueprint('reservation', __name__, url_prefix='/api/reservations')

# RESERVATION TABLE
#------------------------------
# _id: ObjectId -> Primary Key
# user_id: int -> Foreign Key (references Users table)
# host_id: int -> Foreign Key (references Hosts table)
# listing_id: int -> Foreign Key (references Listings table)
# start_date: date
# end_date: date
# guests: int -> number of guests
# total_price: float -> total price of the reservation
# status: str -> status of the reservation (e.g., "pending", "upcoming", "declined", "past", "unpaid")

# NOTE: THESE ROUTES REQUIRE ADMIN PRIVILEGES
@reservation_bp.route("/", methods=["GET"])
@jwt_required()
def get_reservations():
    db = get_db()
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403

    reservations = list(db.reservations.find({}))

    return Response(
        json_util.dumps(reservations),
        mimetype="application/json"
    )
    
@reservation_bp.route('/<reservation_id>', methods=['DELETE'])
@jwt_required()
def delete_reservation(reservation_id):
    db = get_db()
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    result = db.reservations.delete_one({'_id': _id})
    if result.deleted_count:
        return jsonify({'message': 'Reservation deleted'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404

# NOTE: THESE ROUTES REQUIRE HOST PRIVILEGES
@reservation_bp.route('/host/<host_id>', methods=['GET'])
@jwt_required()
def get_reservations_by_host(host_id):
    db = get_db()
    
    _id = to_object_id(host_id)
    if not _id:
        return jsonify({'error': 'Invalid host ID'}), 400
    
    if not is_host(db):
        return jsonify({'error': 'Host privileges required'}), 403
    
    reservations = list(db.reservations.find({'host_id': _id}))
    
    return Response(
        json_util.dumps(reservations),
        mimetype="application/json"
    )

@reservation_bp.route('/<reservation_id>/accept', methods=['POST'])
@jwt_required()
def accept_reservation(reservation_id):
    db = get_db()
    
    if not is_host(db):
        return jsonify({'error': 'Host privileges required'}), 403
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    result = db.reservations.update_one(
        {'_id': _id},
        {'$set': {'status': 'upcoming'}}
    )
    
    if result.matched_count:
        return jsonify({'message': 'Reservation accepted'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/<reservation_id>/decline', methods=['POST'])
@jwt_required()
def decline_reservation(reservation_id):
    db = get_db()
    
    if not is_host(db):
        return jsonify({'error': 'Host privileges required'}), 403
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    result = db.reservations.update_one(
        {'_id': _id},
        {'$set': {'status': 'declined'}}
    )
    
    if result.matched_count:
        return jsonify({'message': 'Reservation declined'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404


@reservation_bp.route('/<reservation_id>', methods=['PUT'])
@jwt_required()
def update_reservation(reservation_id):
    db = get_db()
    data = request.json
    
    print(data)
    # Validate data
    if not check_validation(data, update_reservation_validations):
        return jsonify({'error': 'Invalid data'}), 400
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    result = db.reservations.update_one({'_id': _id}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Reservation updated'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404

# NOTE: THESE ROUTES REQUIRE AUTHENTICATION
@reservation_bp.route('/', methods=['POST'])
@jwt_required()
def create_reservation():
    db = get_db()
    data = request.json
    data['status'] = 'unpaid'  # Default status

    # Validate data
    validation = check_validation(data, reservations_validations)
    date_validation = check_reservation_dates(data)
    
    if not validation:
        return jsonify({'error': 'Invalid data'}), 400
    if not date_validation:
        return jsonify({'error': 'Invalid reservation dates'}), 400


    # Convert string IDs to ObjectIds for consistency
    if 'user_id' in data:
        user_id = to_object_id(data['user_id'])
        if not user_id:
            return jsonify({'error': 'Invalid user ID'}), 400
        data['user_id'] = user_id
    
    if 'host_id' in data:
        host_id = to_object_id(data['host_id'])
        if not host_id:
            return jsonify({'error': 'Invalid host ID'}), 400
        data['host_id'] = host_id
    
    if 'listing_id' in data:
        listing_id = to_object_id(data['listing_id'])
        if not listing_id:
            return jsonify({'error': 'Invalid listing ID'}), 400
        data['listing_id'] = listing_id
    
    result = db.reservations.insert_one(data)
    return jsonify({'_id': str(result.inserted_id)}), 201

@reservation_bp.route('/<reservation_id>', methods=['GET'])
@jwt_required()
def get_reservation(reservation_id):
    db = get_db()
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    reservation = db.reservations.find_one({'_id': _id})
    if reservation:
        return Response(
            json_util.dumps(reservation),
            mimetype="application/json"
        ) 
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_reservations_by_user(user_id):
    db = get_db()
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    reservations = list(db.reservations.find({'user_id': _id}))
    
    return Response(
        json_util.dumps(reservations),
        mimetype="application/json"
    )

@reservation_bp.route('/<reservation_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_reservation(reservation_id):
    db = get_db()
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    result = db.reservations.update_one(
        {'_id': _id},
        {'$set': {'status': 'canceled'}}
    )
    
    if result.matched_count:
        return jsonify({'message': 'Reservation canceled'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
