"""Fix project ownership using exact _id"""
from pymongo import MongoClient
from bson import ObjectId
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

# Your correct user ID
correct_user_id = "6946defbb667c70351768cfa"  # sudhanvaballary1@gmail.com

# Find by exact _id
project_id = ObjectId("6946e3be4c4738e5a31dea2b")
project = db.projects.find_one({"_id": project_id})

if project:
    print(f"Found project: {project['title']}")
    print(f"Current created_by: {project['created_by']}")
    print(f"Current team_members: {project['team_members']}")
    print()
    
    # Update to correct user
    old_creator = project['created_by']
    
    db.projects.update_one(
        {"_id": project_id},
        {
            "$set": {
                "created_by": correct_user_id,
                "team_members": [correct_user_id]
            }
        }
    )
    
    # Verify
    updated = db.projects.find_one({"_id": project_id})
    print("UPDATED:")
    print(f"  created_by: {updated['created_by']}")
    print(f"  team_members: {updated['team_members']}")
    print()
    print("✅ Ownership transferred successfully!")
else:
    print("Project not found!")

client.close()
