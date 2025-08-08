#!/usr/bin/env python3
"""
Test MongoDB Atlas connectivity
"""

import pymongo
from pymongo import MongoClient
import sys

def test_mongo_connection():
    # Your MongoDB Atlas connection string
    mongo_uri = "mongodb+srv://ukgaming:Sudhanva%40104@cluster0.4xhbbck.mongodb.net/projectMngmt?retryWrites=true&w=majority"
    
    print("Testing MongoDB Atlas connection...")
    print(f"URI: {mongo_uri}")
    print("-" * 60)
    
    try:
        # Test connection
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        
        # Test ping
        client.admin.command('ping')
        print("✅ SUCCESS: MongoDB Atlas connection working!")
        
        # Test database access
        db = client.projectMngmt
        collections = db.list_collection_names()
        print(f"✅ Database accessible. Collections: {collections}")
        
        # Test write operation
        test_collection = db.test_connection
        result = test_collection.insert_one({"test": "connection", "timestamp": "now"})
        test_collection.delete_one({"_id": result.inserted_id})
        print("✅ Write/Delete operations working!")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_mongo_connection()
    sys.exit(0 if success else 1) 