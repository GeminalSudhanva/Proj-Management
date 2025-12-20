"""Fix Cars M project ownership"""
from pymongo import MongoClient
from bson import ObjectId
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

# Your correct user ID
correct_user_id = "6946defbb667c70351768cfa"  # sudhanvaballary1@gmail.com

# Find Cars M project
project = db.projects.find_one({"title": {"$regex": "^Cars", "$options": "i"}})

if project:
    print(f"Found project: {project['title']}")
    print(f"Current created_by: {project['created_by']}")
    
    db.projects.update_one(
        {"_id": project["_id"]},
        {"$set": {"created_by": correct_user_id, "team_members": [correct_user_id]}}
    )
    
    print(f"✅ Ownership transferred to {correct_user_id}")
else:
    print("Project not found!")

client.close()
