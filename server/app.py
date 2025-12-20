import os
import configparser

from flask import Flask
from json import JSONEncoder
from flask_cors import CORS
from bson import json_util, ObjectId
from datetime import datetime, timedelta
from flask_jwt_extended import JWTManager

# Import blueprints
from routes.reservation import reservation_bp
from routes.auth import auth_bp
from routes.user import user_bp
from routes.listings import listings_bp
from routes.messages import messages_bp

CONFIG_PATH = os.path.join(os.path.dirname(__file__), ".ini")
config = configparser.ConfigParser()
config.read(CONFIG_PATH)

class MongoJsonEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(obj, ObjectId):
            return str(obj)
        return json_util.default(obj, json_util.CANONICAL_JSON_OPTIONS)


def create_app():
    APP_DIR = os.path.abspath(os.path.dirname(__file__))
    STATIC_FOLDER = os.path.join(APP_DIR, 'build/static')
    TEMPLATE_FOLDER = os.path.join(APP_DIR, 'build')

    app = Flask(__name__, static_folder=STATIC_FOLDER,
                template_folder=TEMPLATE_FOLDER,
                )
    
    app.config["JWT_SECRET_KEY"] = config.get("PROD", "SECRET_KEY")
    
    jwt = JWTManager(app)
    CORS(app)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(reservation_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(messages_bp)
    
    app.json_encoder = MongoJsonEncoder

    return app

if __name__ == "__main__":
    app = create_app()
    app.config['DEBUG'] = True  
    app.run()