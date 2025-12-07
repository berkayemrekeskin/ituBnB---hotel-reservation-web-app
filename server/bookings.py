from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required

booking_bp = Blueprint('booking', __name__, url_prefix='/api/booking')

@booking_bp.route("/", methods=["GET"])
@jwt_required()
def get_bookings():
    db = get_db()
    bookings = list(db.bookings.find({}))
    
    return Response(
        json_util.dumps(bookings),
        mimetype="application/json"
    )
    
@booking_bp.route('/<booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    db = get_db()
    booking = db.bookings.find_one({'booking_id': int(booking_id)})
    if booking:
        return Response(
            json_util.dumps(booking),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'Booking not found'}), 404
    
@booking_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    db = get_db()
    data = request.json
    result = db.bookings.insert_one(data)
    return jsonify({'inserted_id': str(result.inserted_id)}), 201

@booking_bp.route('/<booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    db = get_db()
    data = request.json
    result = db.bookings.update_one({'booking_id': int(booking_id)}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Booking updated'})
    else:
        return jsonify({'error': 'Booking not found'}), 404
    
@booking_bp.route('/<booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id):
    db = get_db()
    result = db.bookings.delete_one({'booking_id': int(booking_id)})
    if result.deleted_count:
        return jsonify({'message': 'Booking deleted'})
    else:
        return jsonify({'error': 'Booking not found'}), 404
    