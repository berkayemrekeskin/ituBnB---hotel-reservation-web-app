# NOTE: CRUD routes for Listings

from flask import Flask, jsonify, Response, Blueprint, request
from flask_jwt_extended import jwt_required
from flask_jwt_extended import get_jwt_identity
from bson import json_util
from bson.objectid import ObjectId
from db import get_db
from helpers import check_validation, to_object_id, is_host
from validations import listings_validations

# LISTINGS TABLE
#------------------------------
# _id: ObjectId -> Primary Key 
# title: str
# description: str
# price_per_night: float
# location: str
# host_id: int -> Foreign Key (references Hosts table)
# amenities: list of str
# naerby: list of str
# details: dict (e.g., {"bedrooms": 2, "bathrooms": 1, "max_guests": 4})
# photos: list of str (URLs or file paths to photos)

listings_bp = Blueprint("listings", __name__, url_prefix="/api/listings")


# NOTE : Public endpoint - no authentication required for browsing
@listings_bp.route("/", methods=["GET"])
def get_listings():
    db = get_db()
    
    # Fetching all listings from the database
    listings = list(db.listings.find({}))
    return Response(
        json_util.dumps(listings),
        mimetype="application/json"
    )

# Get listing detail by listing_id (public endpoint)
@listings_bp.route("/<listing_id>", methods=["GET"])
def get_listing_detail(listing_id):
    db = get_db()
    
    # Converting listing_id to ObjectId for querying
    _id = to_object_id(listing_id)
    if not _id:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    # Fetching the listing from the database
    listing = db.listings.find_one({"_id": _id})
    
    # Returning the listing or error if not found
    if listing:
        return Response(
            json_util.dumps(listing),
            mimetype="application/json"
        )
    else:
        return jsonify({"error": "Listing not found"}), 404

# NOTE : THESE ROUTES REQUIRE ADMIN PRIVILEGES
@listings_bp.route("/admin/pending", methods=["GET"])
def get_pending_listings():
    db = get_db()
    
    # Fetch all pending listings
    listings = list(db.listings.find({"status": "pending"}))
    return Response(
        json_util.dumps(listings),
        mimetype="application/json"
    )

@listings_bp.route("/admin/approve-listing", methods=["POST"])
def approve_listing():
    db = get_db()
    
    # Get data from request
    data = request.json
    if not data or 'listing_id' not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    # Converting listing_id to ObjectId for querying
    _id = to_object_id(data['listing_id'])
    if not _id:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    # Approving the listing
    result = db.listings.update_one(
        {"_id": _id},
        {"$set": {"status": "approved"}}
    )
    if result.modified_count:
        return jsonify({"message": "Listing approved"})
    else:
        return jsonify({"error": "Listing not found"}), 404


@listings_bp.route("/admin/reject-listing", methods=["POST"])
def reject_listing():
    db = get_db()
    
    # Get data from request
    data = request.json
    if not data or 'listing_id' not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    # Converting listing_id to ObjectId for querying
    _id = to_object_id(data['listing_id'])
    if not _id:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    # Rejecting the listing
    result = db.listings.update_one(
        {"_id": _id},
        {"$set": {"status": "declined"}}
    )
    if result.modified_count:
        return jsonify({"message": "Listing rejected"})
    else:
        return jsonify({"error": "Listing not found"}), 404

# NOTE : THESE ROUTES ALLOW ANY AUTHENTICATED USER TO CREATE LISTINGS
# First listing creation automatically promotes user to host role
@listings_bp.route("/", methods=["POST"])
@jwt_required()
def create_listing():
    db = get_db()
    
    current_user = get_jwt_identity()
    user = db.users.find_one({"username": current_user})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # If user is not a host yet, promote them to host
    if user.get('role') != 'host':
        db.users.update_one(
            {"_id": user['_id']},
            {"$set": {"role": "host"}}
        )
    
    # Get data from request
    data = request.json
    
    # Set host_id and status automatically
    host_id = to_object_id(str(user['_id']))
    if not host_id:
        return jsonify({"error": "Invalid user ID"}), 400
    
    data['host_id'] = host_id
    data['status'] = 'pending'  # All new listings start as pending for admin approval

        # Validate data
    if not check_validation(data, listings_validations):
        return jsonify({"error": "Invalid data"}), 400
    
    data['city'] = data['city'].lower()
    # Inserting the new listing into the database
    result = db.listings.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@listings_bp.route("/host/<host_id>", methods=["GET"])
@jwt_required()
def get_listings_by_host(host_id):
    db = get_db()
    
    # Converting host_id to ObjectId for querying
    _id = to_object_id(host_id)
    if not _id:
        return jsonify({"error": "Invalid host ID"}), 400
    
    # Fetching all listings for this host
    listings = list(db.listings.find({"host_id": _id}))
    return Response(
        json_util.dumps(listings),
        mimetype="application/json"
    )
    
@listings_bp.route("/<listing_id>", methods=["DELETE"])
@jwt_required()
def delete_listing(listing_id):
    db = get_db()
    
    # Check if current user is host
    if not is_host(db):
        return jsonify({"error": "Host privileges required"}), 403

    # Converting listing_id to ObjectId for querying and checking validity
    _id = to_object_id(listing_id)
    if not _id:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    # Deleting the listing from the database
    result = db.listings.delete_one({"_id": _id})
    if result.deleted_count:
        return jsonify({"message": "Listing deleted"})
    else:
        return jsonify({"error": "Listing not found"}), 404
    
@listings_bp.route("/<listing_id>", methods=["PUT"])
@jwt_required()
def update_listing(listing_id):
    db = get_db()

    # Check if current user is host
    if not is_host(db):
        return jsonify({"error": "Host privileges required"}), 403

    # Converting listing_id to ObjectId for querying and checking validity
    _id = to_object_id(listing_id)
    if not _id:
        return jsonify({"error": "Invalid listing ID"}), 400
    
    # Get data from request and validate
    data = request.json
    if not check_validation(data, listings_validations):
        return jsonify({"error": "Invalid data"}), 400
    
    # Updating the listing in the database
    result = db.listings.update_one(
        {"_id": _id},
        {"$set": data}
    )
    if result.matched_count:
        return jsonify({"message": "Listing updated"})
    else:
        return jsonify({"error": "Listing not found"}), 404