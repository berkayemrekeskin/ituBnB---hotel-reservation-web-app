from flask import Blueprint, jsonify, Response, request
from flask_jwt_extended import jwt_required
from bson import json_util
from db import get_db
from helpers import to_object_id, check_validation
from validations import search_validations

search_bp = Blueprint('search', __name__, url_prefix='/search')

# NOTE: SEARCH WILL HAVE 2 TYPES, CLASSIC FILTERING AND AI POWERED SEARCH
