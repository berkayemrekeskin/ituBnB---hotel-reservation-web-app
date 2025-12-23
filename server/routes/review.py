from flask import jsonify, request, Blueprint, Response
from db import get_db 
from bson import json_util
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson.objectid import ObjectId
from datetime import datetime
from helpers import (
    check_validation, 
    validate_review_creation,
    to_object_id, 
    is_admin
)
from validations import review_validations

review_bp = Blueprint('review', __name__, url_prefix='/api/reviews')

# REVIEW TABLE
#------------------------------
# _id: ObjectId -> Primary Key
# reservation_id: str -> Foreign Key (references Reservations table)
# user_id: str -> Foreign Key (references Users table) - the customer who wrote the review
# listing_id: str -> Foreign Key (references Listings table)
# rating: int/float -> rating (1-5 stars)
# comment: str -> review text/comment
# created_at: datetime -> when the review was created
# updated_at: datetime -> when the review was last updated

# NOTE: THESE ROUTES REQUIRE AUTHENTICATION
@review_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    db = get_db()
    data = request.json
    
    # Validate required fields (reservation_id, property_id, rating)
    required_fields = {k: v for k, v in review_validations.items() if k != 'comment'}
    if not check_validation(data, required_fields):
        return jsonify({'error': 'Invalid data'}), 400
    
    # Validate optional comment field if provided
    if 'comment' in data and not review_validations['comment'](data.get('comment')):
        return jsonify({'error': 'Invalid comment format'}), 400
    
    # Get current user
    current_username = get_jwt_identity()
    current_user = db.users.find_one({'username': current_username})
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verify reservation exists
    reservation_id = to_object_id(data.get('reservation_id'))
    if not reservation_id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    reservation = db.reservations.find_one({'_id': reservation_id})
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    # Validate review creation business logic
    is_valid, error_message = validate_review_creation(db, data, current_user, reservation)
    if not is_valid:
        return jsonify({'error': error_message}), 400
    
    # Prepare review data
    review_data = {
        'reservation_id': str(reservation_id),
        'user_id': str(current_user['_id']),
        'property_id': data.get('property_id'),
        'rating': data.get('rating'),
        'comment': data.get('comment', ''),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    # Insert review
    result = db.reviews.insert_one(review_data)
    return jsonify({'_id': str(result.inserted_id), 'message': 'Review created successfully'}), 201

@review_bp.route('/<review_id>', methods=['GET'])
@jwt_required()
def get_review(review_id):
    db = get_db()
    
    _id = to_object_id(review_id)
    if not _id:
        return jsonify({'error': 'Invalid review ID'}), 400
    
    review = db.reviews.find_one({'_id': _id})
    if review:
        return Response(
            json_util.dumps(review),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'Review not found'}), 404

@review_bp.route('/reservation/<reservation_id>', methods=['GET'])
@jwt_required()
def get_review_by_reservation(reservation_id):
    db = get_db()
    
    _id = to_object_id(reservation_id)
    if not _id:
        return jsonify({'error': 'Invalid reservation ID'}), 400
    
    review = db.reviews.find_one({'reservation_id': str(_id)})
    if review:
        return Response(
            json_util.dumps(review),
            mimetype="application/json"
        )
    else:
        return jsonify({'error': 'Review not found for this reservation'}), 404

@review_bp.route('/property/<property_id>', methods=['GET'])
def get_reviews_by_property(property_id):
    """
    Get all reviews for a property.
    This endpoint is public (no authentication required) so anyone can view reviews.
    """
    db = get_db()
    
    # Validate property_id format
    if not property_id or len(property_id.strip()) == 0:
        return jsonify({'error': 'Invalid property ID'}), 400
    
    # Try to validate property exists (optional check)
    property_obj_id = to_object_id(property_id)
    if property_obj_id:
        property_exists = db.listings.find_one({'_id': property_obj_id})
        if not property_exists:
            # Still return empty array instead of error, in case property_id format differs
            return Response(
                json_util.dumps([]),
                mimetype="application/json"
            )
    
    # Fetch reviews for the property
    reviews = list(db.reviews.find({'property_id': property_id}).sort('created_at', -1))
    
    # Populate user information for each review
    for review in reviews:
        user_id = review.get('user_id')
        if user_id:
            try:
                user_obj_id = ObjectId(user_id) if ObjectId.is_valid(user_id) else None
                if user_obj_id:
                    user = db.users.find_one({'_id': user_obj_id})
                    if user:
                        review['user'] = {
                            'name': user.get('name', 'Anonymous'),
                            'avatar': user.get('avatar')  # If avatar field exists in user model
                        }
            except Exception:
                # If user_id format is invalid, skip user population
                pass
    
    return Response(
        json_util.dumps(reviews),
        mimetype="application/json"
    )

@review_bp.route('/user/<user_id>', methods=['GET'])
@jwt_required()
def get_reviews_by_user(user_id):
    db = get_db()
    
    _id = to_object_id(user_id)
    if not _id:
        return jsonify({'error': 'Invalid user ID'}), 400
    
    reviews = list(db.reviews.find({'user_id': str(_id)}).sort('created_at', -1))
    
    return Response(
        json_util.dumps(reviews),
        mimetype="application/json"
    )

@review_bp.route('/<review_id>', methods=['PUT'])
@jwt_required()
def update_review(review_id):
    db = get_db()
    data = request.json
    
    # Get current user
    current_username = get_jwt_identity()
    current_user = db.users.find_one({'username': current_username})
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    _id = to_object_id(review_id)
    if not _id:
        return jsonify({'error': 'Invalid review ID'}), 400
    
    # Find review
    review = db.reviews.find_one({'_id': _id})
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if current user is the owner of the review or admin
    if review.get('user_id') != str(current_user['_id']) and not is_admin(db):
        return jsonify({'error': 'You can only update your own reviews'}), 403
    
    # Validate and build update data (only rating and comment can be updated)
    update_data = {}
    if 'rating' in data:
        if not review_validations['rating'](data['rating']):
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        update_data['rating'] = data['rating']
    if 'comment' in data:
        if not review_validations['comment'](data['comment']):
            return jsonify({'error': 'Invalid comment format'}), 400
        update_data['comment'] = data['comment']
    
    if not update_data:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    update_data['updated_at'] = datetime.utcnow()
    
    # Update review
    result = db.reviews.update_one(
        {'_id': _id},
        {'$set': update_data}
    )
    
    if result.matched_count:
        return jsonify({'message': 'Review updated successfully'})
    else:
        return jsonify({'error': 'Review not found'}), 404

@review_bp.route('/<review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    db = get_db()
    
    # Get current user
    current_username = get_jwt_identity()
    current_user = db.users.find_one({'username': current_username})
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    _id = to_object_id(review_id)
    if not _id:
        return jsonify({'error': 'Invalid review ID'}), 400
    
    # Find review
    review = db.reviews.find_one({'_id': _id})
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    
    # Check if current user is the owner of the review or admin
    if review.get('user_id') != str(current_user['_id']) and not is_admin(db):
        return jsonify({'error': 'You can only delete your own reviews'}), 403
    
    # Delete review
    result = db.reviews.delete_one({'_id': _id})
    if result.deleted_count:
        return jsonify({'message': 'Review deleted successfully'})
    else:
        return jsonify({'error': 'Review not found'}), 404

@review_bp.route('/property/<property_id>/stats', methods=['GET'])
def get_property_review_stats(property_id):
    """
    Get review statistics for a property (average rating, total count).
    This endpoint is public (no authentication required).
    """
    db = get_db()
    
    # Validate property_id format
    if not property_id or len(property_id.strip()) == 0:
        return jsonify({'error': 'Invalid property ID'}), 400
    
    # Fetch all reviews for the property
    reviews = list(db.reviews.find({'property_id': property_id}))
    
    if not reviews:
        return jsonify({
            'property_id': property_id,
            'average_rating': 0,
            'total_reviews': 0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        })
    
    # Calculate statistics
    total_reviews = len(reviews)
    total_rating = sum(review.get('rating', 0) for review in reviews)
    average_rating = round(total_rating / total_reviews, 2)
    
    # Calculate rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in reviews:
        rating = int(review.get('rating', 0))
        if 1 <= rating <= 5:
            rating_distribution[rating] += 1
    
    return jsonify({
        'property_id': property_id,
        'average_rating': average_rating,
        'total_reviews': total_reviews,
        'rating_distribution': rating_distribution
    })

# NOTE: THIS ROUTE REQUIRES ADMIN PRIVILEGES
@review_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_reviews():
    db = get_db()
    
    if not is_admin(db):
        return jsonify({'error': 'Admin privileges required'}), 403
    
    reviews = list(db.reviews.find({}).sort('created_at', -1))
    
    return Response(
        json_util.dumps(reviews),
        mimetype="application/json"
    )

