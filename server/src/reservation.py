from flask import jsonify, request, Blueprint
from src.db import get_db 

reservation_bp = Blueprint('reservation', __name__, url_prefix='/api/reservations')

@reservation_bp.route('/', methods=['GET'])
def get_reservations():
    db = get_db()
    reservations = list(db.reservations.find())
    return jsonify(reservations)

@reservation_bp.route('/', methods=['POST'])
def create_reservation():
    db = get_db()
    data = request.json
    result = db.reservations.insert_one(data)
    return jsonify({'inserted_id': str(result.inserted_id)}), 201

@reservation_bp.route('/<reservation_id>', methods=['GET'])
def get_reservation(reservation_id):
    db = get_db()
    reservation = db.reservations.find_one({'_id': reservation_id})
    if reservation:
        return jsonify(reservation) 
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/<reservation_id>', methods=['DELETE'])
def delete_reservation(reservation_id):
    db = get_db()
    result = db.reservations.delete_one({'_id': reservation_id})
    if result.deleted_count:
        return jsonify({'message': 'Reservation deleted'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
@reservation_bp.route('/<reservation_id>', methods=['PUT'])
def update_reservation(reservation_id):
    db = get_db()
    data = request.json
    result = db.reservations.update_one({'_id': reservation_id}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Reservation updated'})
    else:
        return jsonify({'error': 'Reservation not found'}), 404
    
