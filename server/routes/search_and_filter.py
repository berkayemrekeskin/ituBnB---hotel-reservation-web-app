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
    required_keys = ["city", "amenities", "details", "nearby", "price"]
    if not all(key in filters for key in required_keys):
        raise ValueError("AI returned an incomplete schema")

    return filters

def build_mongo_query(filters: dict) -> dict:
    query = {}

    # Basic Fields
    if filters.get("city"):
        query["city"] = filters["city"]

    if filters.get("property_type"):
        query["property_type"] = filters["property_type"]

    # Details (Rooms, Guests, etc.)
    # We use $gte (Greater Than or Equal) so a "3 room" search finds "3 and 4 room" places
    details = filters.get("details", {})
    for key in ["rooms", "guests", "bedrooms", "bathrooms"]:
        if details.get(key) is not None:
            query[f"details.{key}"] = {"$gte": details[key]}

    # Amenities & Nearby (Dynamic Boolean mapping)
    for category in ["amenities", "nearby"]:
        for key, value in filters.get(category, {}).items():
            if value is True:
                query[f"{category}.{key}"] = True
            elif value is False:
                query[f"{category}.{key}"] = False

    # Price Logic
    price = filters.get("price", {})
    if price.get("min_per_night") or price.get("max_per_night"):
        query["price_per_night"] = {}
        if price.get("min_per_night"):
            query["price_per_night"]["$gte"] = price["min_per_night"]
        if price.get("max_per_night"):
            query["price_per_night"]["$lte"] = price["max_per_night"]

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

        # 4. Database execution
        # Ensure you have your db connection established
        
        db = get_db()
        listings = list(db.listings.find(mongo_query))
        
        # Convert ObjectId to string for JSON serialization
        for listing in listings:
            if '_id' in listing:
                listing['_id'] = str(listing['_id'])

        return jsonify({
            "extracted_filters": validated_filters, # Useful for debugging the UI
            "results_count": len(listings),
            "listings": listings,
            "message": "Search executed successfully",
            "query_used": mongo_query,
            "response_from_ai": raw_filters
        })


        #return Response(
        #    json_util.dumps({
        #        "extracted_filters": validated_filters, # Useful for debugging the UI
        #        "results_count": len(listings),
        #        "listings": listings
        #    }), 
        #    mimetype='application/json'
        #)

    except Exception as e:
        # Log the error for your own debugging
        print(f"Error: {e}")
        return jsonify({"error": "The search engine had trouble understanding that. Try being more specific."}), 500



@search_bp.route('/<city>', methods=['GET'])
def search_listings(city: str):
    db = get_db()
    city = city.lower()
    listings = list(db.listings.find({"city": city}))
    print(listings) 
    return Response(json_util.dumps({"listings": listings}), mimetype='application/json')