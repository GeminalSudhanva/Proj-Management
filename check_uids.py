"""Check for firebase_uid issues"""
from pymongo import MongoClient
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

print("All users with their firebase_uid:")
print("-" * 70)
for u in db.users.find():
    print(f"_id: {u['_id']}")
    print(f"email: {u.get('email')}")
    print(f"firebase_uid: {u.get('firebase_uid', 'NOT SET')}")
    print()

# Check Firebase UID: rGu8znjn1dgg6W9ZHBjyn3niQds2 (current user's)
print("=" * 70)
print("Looking up by firebase_uid: rGu8znjn1dgg6W9ZHBjyn3niQds2")
user = db.users.find_one({"firebase_uid": "rGu8znjn1dgg6W9ZHBjyn3niQds2"})
if user:
    print(f"Found: {user['_id']} - {user['email']}")
else:
    print("NOT FOUND!")

client.close()
