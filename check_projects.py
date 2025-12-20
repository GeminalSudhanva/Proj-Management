"""Quick script to check project created_by values"""
from pymongo import MongoClient
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

print("Projects and their created_by:")
print("-" * 60)
for p in db.projects.find():
    print(f"{p['title']}")
    print(f"  created_by: {p.get('created_by')}")
    print(f"  team_members: {p.get('team_members', [])}")
    print()

client.close()
