"""Debug project titles"""
from pymongo import MongoClient
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

print("All projects with raw title bytes:")
for p in db.projects.find():
    title = p.get('title', '')
    print(f"  Title: '{title}' (len={len(title)})")
    print(f"  bytes: {title.encode('utf-8')}")
    print(f"  _id: {p['_id']}")
    print()

client.close()
