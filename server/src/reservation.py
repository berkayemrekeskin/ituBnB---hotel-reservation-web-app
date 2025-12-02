from flask import Flask, jsonify, request, Blueprint
from src.db import get_db, db_connection_test

reservation_bp = Blueprint('reservation', __name__, url_prefix='/api/reservations')
@reservation_bp.route('/test-connection', methods=['GET'])
def test_connection():
    """
    Endpoint to test database connection
    """
    if db_connection_test():
        return jsonify({"status": "success", "message": "Database connection successful"}), 200
    else:
        return jsonify({"status": "error", "message": "Database connection failed"}), 500
    
    
    