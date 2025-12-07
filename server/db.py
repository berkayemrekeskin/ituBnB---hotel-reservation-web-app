import configparser
from pymongo import MongoClient
import os

CONFIG_PATH = os.path.join(os.path.dirname(__file__), ".ini")
config = configparser.ConfigParser()
config.read(CONFIG_PATH)

MONGO_URI = config.get("PROD", "MONGO_URI") 

client = MongoClient(MONGO_URI)
db = client.get_database()

def get_db():
    return db

def db_connection_test():
    try:
        print(db.list_collection_names());
        return True
    except Exception as e:
        print("DB connection error:", e)
        return False
