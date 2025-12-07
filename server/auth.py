from flask import Blueprint, request, jsonify
from db import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    db = get_db()
    data = request.json
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if db.users.find_one({'email': email}):
        return jsonify({'error': 'Email already exists'}), 400

    if db.users.find_one({'username': username}):
        return jsonify({'error': 'Username already exists'}), 400
    
    hashed_password = generate_password_hash(password)
    db.users.insert_one({'email': email, 'username': username, 'password': hashed_password})
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    db = get_db()
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password'], password):
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401
    
@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    db = get_db()
    data = request.json
    username = data.get('username')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password'], old_password):
        new_hashed_password = generate_password_hash(new_password)
        db.users.update_one({'username': username}, {'$set': {'password': new_hashed_password}})
        return jsonify({'message': 'Password changed successfully'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@auth_bp.route('/delete-account', methods=['POST'])
def delete_account():
    db = get_db()
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = db.users.find_one({'username': username})
    if user and check_password_hash(user['password'], password):
        db.users.delete_one({'username': username})
        return jsonify({'message': 'Account deleted successfully'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401
