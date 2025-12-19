from flask import Flask, jsonify, Response, Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import json_util
from bson.objectid import ObjectId
from db import get_db
from helpers import check_validation
from config import listings_validations

# LISTINGS TABLE
#------------------------------
# _id: ObjectId -> Primary Key 
# title: str
# description: str
# price_per_night: float
# location: str
# host_id: int -> Foreign Key (references Hosts table)
# amenities: list of str
# details: dict (e.g., {"bedrooms": 2, "bathrooms": 1, "max_guests": 4})
# photos: list of str (URLs or file paths to photos)

listings_bp = Blueprint("listings", __name__, url_prefix="/api/listings")

# Get all listings
@listings_bp.route("/", methods=["GET"])
@jwt_required()
def get_listings():
    db = get_db()
    listings = list(db.listings.find({}))
    return Response(
        json_util.dumps(listings),
        mimetype="application/json"
    )

# Get listing detail by listing_id
@listings_bp.route("/<listing_id>", methods=["GET"])
@jwt_required()
def get_listing_detail(listing_id):
    db = get_db()
    
    # Converting listing_id to ObjectId for querying
    listing_id_obj = ObjectId(listing_id) if ObjectId.is_valid(listing_id) else None
    if not listing_id_obj:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    listing = db.listings.find_one({"_id": listing_id_obj})
    
    if listing:
        return Response(
            json_util.dumps(listing),
            mimetype="application/json"
        )
    else:
        return jsonify({"error": "Listing not found"}), 404

# Create a new listing
@listings_bp.route("/", methods=["POST"])
@jwt_required()
def create_listing():
    db = get_db()
    data = request.json
    
    # Validation
    validation = check_validation(data, listings_validations)
    if not validation:
        return jsonify({"error": "Invalid data"}), 400
    
    result = db.listings.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201
    
@listings_bp.route("/<listing_id>", methods=["DELETE"])
@jwt_required()
def delete_listing(listing_id):
    db = get_db()
    
    # Converting listing_id to ObjectId for querying
    listing_id_obj = ObjectId(listing_id) if ObjectId.is_valid(listing_id) else None
    if not listing_id_obj:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    result = db.listings.delete_one({"_id": int(listing_id)})
    if result.deleted_count:
        return jsonify({"message": "Listing deleted"})
    else:
        return jsonify({"error": "Listing not found"}), 404
    
@listings_bp.route("/<listing_id>", methods=["PUT"])
@jwt_required()
def update_listing(listing_id):
    db = get_db()

    # Converting listing_id to ObjectId for querying
    listing_id_obj = ObjectId(listing_id) if ObjectId.is_valid(listing_id) else None
    if not listing_id_obj:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    data = request.json
    
    # Validation
    validation = check_validation(data, listings_validations)
    if not validation:
        return jsonify({"error": "Invalid data"}), 400
    
    result = db.listings.update_one(
        {"_id": listing_id_obj},
        {"$set": data}
    )
    if result.matched_count:
        return jsonify({"message": "Listing updated"})
    else:
        return jsonify({"error": "Listing not found"}), 404