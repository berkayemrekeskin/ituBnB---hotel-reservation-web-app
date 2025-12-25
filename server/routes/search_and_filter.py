from flask import Blueprint, jsonify, Response, request
from flask_jwt_extended import jwt_required
from bson import json_util
from db import get_db
from helpers import to_object_id, check_validation
from validations import search_validations
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
from search_prompt import SYSTEM_PROMPT
load_dotenv()

search_bp = Blueprint('search', __name__, url_prefix='/api/search')
GOOGLE_GENAI_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")    

import json
from google import genai
from google.genai import types

client = genai.Client(api_key=GOOGLE_GENAI_API_KEY)


def transform_listing_for_frontend(listing):
    """
    Transform listing data from database format to frontend format.
    Converts amenities and nearby from arrays to objects with boolean properties.
    """
    if not listing:
        return listing
    
    # Define all possible amenities
    all_amenities = [
        "wifi", "kitchen", "heating", "air_conditioning", 
        "washer", "dryer", "free_parking", "pool", "gym", "pet_friendly"
    ]
    
    # Define all possible nearby features
    all_nearby = [
        "attractions", "public_transport", "restaurants", 
        "shopping_centers", "parks"
    ]
    
    # Convert amenities array to object
    if "amenities" in listing and isinstance(listing["amenities"], list):
        amenities_obj = {amenity: (amenity in listing["amenities"]) for amenity in all_amenities}
        listing["amenities"] = amenities_obj
    
    # Convert nearby array to object
    if "nearby" in listing and isinstance(listing["nearby"], list):
        nearby_obj = {feature: (feature in listing["nearby"]) for feature in all_nearby}
        listing["nearby"] = nearby_obj
    
    return listing



def extract_filters(user_input: str) -> dict:
    # Use the SYSTEM_PROMPT you defined in the previous message
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json"
        ),
        contents=user_input
    )
    
    # Gemini returns a string, so we convert it to a Python dict
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        # Fallback in case of a rare parsing error
        return {}
    
def validate_filters(filters: dict) -> dict:
    if not isinstance(filters, dict):
        raise ValueError("Filters must be an object")

    # Match your prompt schema: 'city', 'amenities', 'nearby', 'details', 'price'
    required_keys = ["city", "property_type", "amenities", "nearby", "details", "price"]
    if not all(key in filters for key in required_keys):
        raise ValueError("AI returned an incomplete schema")

    return filters

def build_mongo_query(filters: dict) -> dict:
    query = {}

    # Filter by city
    if filters.get("city"):
        query["city"] = filters["city"]

    # Filter by property type
    if filters.get("property_type"):
        query["property_type"] = filters["property_type"]

    # Filter by amenities - collect all required amenities into an array
    # Use $all to ensure the listing has ALL the required amenities
    amenities = filters.get("amenities", {})
    required_amenities = [key for key, value in amenities.items() if value is True]
    if required_amenities:
        query["amenities"] = {"$all": required_amenities}

    # Filter by nearby features - collect all required features into an array
    # Use $all to ensure the listing has ALL the required nearby features
    nearby = filters.get("nearby", {})
    required_nearby = [key for key, value in nearby.items() if value is True]
    if required_nearby:
        query["nearby"] = {"$all": required_nearby}

    # Filter by details (rooms, guests, beds, bathrooms)
    details = filters.get("details", {})
    
    # Handle rooms with min/max flags
    if details.get("rooms") is not None:
        rooms_value = details["rooms"]
        is_min = details.get("is_rooms_min")
        is_max = details.get("is_rooms_max")
        
        if is_min:
            query["details.rooms"] = {"$gte": rooms_value}
        elif is_max:
            query["details.rooms"] = {"$lte": rooms_value}
        else:
            query["details.rooms"] = rooms_value
    
    # Handle guests with min/max flags
    if details.get("guests") is not None:
        guests_value = details["guests"]
        is_min = details.get("is_guests_min")
        is_max = details.get("is_guests_max")
        
        if is_min:
            query["details.guests"] = {"$gte": guests_value}
        elif is_max:
            query["details.guests"] = {"$lte": guests_value}
        else:
            query["details.guests"] = guests_value
    
    # Handle beds with min/max flags
    if details.get("beds") is not None:
        beds_value = details["beds"]
        is_min = details.get("is_beds_min")
        is_max = details.get("is_beds_max")
        
        if is_min:
            query["details.beds"] = {"$gte": beds_value}
        elif is_max:
            query["details.beds"] = {"$lte": beds_value}
        else:
            query["details.beds"] = beds_value
    
    # Handle bathrooms with min/max flags
    if details.get("bathrooms") is not None:
        bathrooms_value = details["bathrooms"]
        is_min = details.get("is_bathrooms_min")
        is_max = details.get("is_bathrooms_max")
        
        if is_min:
            query["details.bathrooms"] = {"$gte": bathrooms_value}
        elif is_max:
            query["details.bathrooms"] = {"$lte": bathrooms_value}
        else:
            query["details.bathrooms"] = bathrooms_value

    # Filter by price range
    price = filters.get("price", {})
    if price and isinstance(price, dict):
        if price.get("min_per_night") is not None or price.get("max_per_night") is not None:
            price_query = {}
            if price.get("min_per_night") is not None:
                price_query["$gte"] = price["min_per_night"]
            if price.get("max_per_night") is not None:
                price_query["$lte"] = price["max_per_night"]
            query["price"] = price_query

    return query


@search_bp.route('/ai', methods=['POST'])
# @jwt_required() # Uncomment when your auth is ready
def search_listings_ai():
    data = request.get_json()
    user_query = data.get("query", "")
    
    if not user_query:
        return jsonify({"error": "Please describe what you are looking for"}), 400

    try:
        # 1. AI Extraction
        raw_filters = extract_filters(user_query)

        # 2. Validation
        validated_filters = validate_filters(raw_filters)

        # 3. Build Mongo Query
        mongo_query = build_mongo_query(validated_filters)

        # 4. Database execution - Use the mongo_query to filter results
        db = get_db()
        listings = list(db.listings.find(mongo_query))
        
        # Transform listings for frontend
        transformed_listings = []
        for listing in listings:
            # Calculate reviews stats
            listing_id = str(listing['_id'])
            reviews = list(db.reviews.find({'property_id': listing_id}))
            
            total_reviews = len(reviews)
            if total_reviews > 0:
                total_rating = sum(review.get('rating', 0) for review in reviews)
                average_rating = round(total_rating / total_reviews, 2)
            else:
                average_rating = 0
                
            listing['rating'] = average_rating
            listing['reviews'] = total_reviews
            
            transformed_listings.append(transform_listing_for_frontend(listing))
        
        # Debug output
        print("AI Filters:", raw_filters)
        print("Mongo Query:", mongo_query)
        print("Results Count:", len(listings))

        return Response(
            json_util.dumps({
                "extracted_filters": validated_filters, # Useful for debugging the UI
                "results_count": len(transformed_listings),
                "listings": transformed_listings,
                "message": "Search executed successfully",
                "query_used": mongo_query,
                "response_from_ai": raw_filters
            }), 
            mimetype='application/json'
        )

    except Exception as e:
        # Log the error for your own debugging
        print(f"Error: {e}")
        return jsonify({"error": "The search engine had trouble understanding that. Try being more specific."}), 500



@search_bp.route('/<city>', methods=['GET'])
def search_listings(city: str):
    db = get_db()
    city = city.lower()
    listings = list(db.listings.find({"city": city}))
    
    # Enrich with reviews
    for listing in listings:
        listing_id = str(listing['_id'])
        reviews = list(db.reviews.find({'property_id': listing_id}))
        
        total_reviews = len(reviews)
        if total_reviews > 0:
            total_rating = sum(review.get('rating', 0) for review in reviews)
            average_rating = round(total_rating / total_reviews, 2)
        else:
            average_rating = 0
            
        listing['rating'] = average_rating
        listing['reviews'] = total_reviews

    print(listings) 
    return Response(json_util.dumps({"listings": listings}), mimetype='application/json')