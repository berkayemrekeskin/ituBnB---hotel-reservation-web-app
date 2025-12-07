from flask import Blueprint, request, jsonify, Response
from db import get_db
from bson import json_util
from flask_jwt_extended import jwt_required

hotels_bp = Blueprint('hotels', __name__, url_prefix='/api/hotels') 

@hotels_bp.route("/", methods=["GET"])
@jwt_required()
def get_hotels():
    db = get_db()
    hotels = list(db.hotels.find({}))
    
    return Response(
        json_util.dumps(hotels),
        mimetype="application/json"
    )

@hotels_bp.route('/<hotel_id>', methods=['GET'])
@jwt_required()
def get_hotel(hotel_id):
    db = get_db()
    hotel = db.hotels.find_one({'hotel_id': int(hotel_id)})
    if hotel:
        return Response(
            json_util.dumps(hotel),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'Hotel not found'}), 404
    
@hotels_bp.route('/', methods=['POST'])
@jwt_required()
def create_hotel():
    db = get_db()
    data = request.json
    result = db.hotels.insert_one(data)
    return jsonify({'inserted_id': str(result.inserted_id)}), 201

@hotels_bp.route('/<hotel_id>', methods=['PUT'])
@jwt_required()
def update_hotel(hotel_id):
    db = get_db()
    data = request.json
    result = db.hotels.update_one({'hotel_id': int(hotel_id)}, {'$set': data})
    if result.matched_count:
        return jsonify({'message': 'Hotel updated'})
    else:
        return jsonify({'error': 'Hotel not found'}), 404
    
@hotels_bp.route('/<hotel_id>', methods=['DELETE'])
@jwt_required()
def delete_hotel(hotel_id):
    db = get_db()
    result = db.hotels.delete_one({'hotel_id': int(hotel_id)})
    if result.deleted_count:
        return jsonify({'message': 'Hotel deleted'})
    else:
        return jsonify({'error': 'Hotel not found'}), 404
    
@hotels_bp.route('/search', methods=['GET'])
@jwt_required()
def search_hotels():
    db = get_db()
    query_params = request.args
    query = {}

    if 'name' in query_params:
        query['name'] = {'$regex': query_params.get('name'), '$options': 'i'}
    if 'location' in query_params:
        query['location'] = {'$regex': query_params.get('location'), '$options': 'i'}
    if 'min_price' in query_params and 'max_price' in query_params:
        query['price_per_night'] = {
            '$gte': float(query_params.get('min_price')),
            '$lte': float(query_params.get('max_price'))
        }

    hotels = list(db.hotels.find(query))
    return jsonify(hotels)

