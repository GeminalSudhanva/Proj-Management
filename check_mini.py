"""Check project creation details"""
from pymongo import MongoClient
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

print("Mini Project details:")
print("-" * 60)
project = db.projects.find_one({"title": "Mini project"})
if project:
    for key, value in project.items():
        print(f"  {key}: {value}")

client.close()
