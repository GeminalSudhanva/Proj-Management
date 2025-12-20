"""Check user by email"""
from pymongo import MongoClient
import os

mongo_uri = os.environ.get("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.projectMngmt

email = "sudhanvaballary1@gmail.com"
print(f"Looking for user with email: {email}")
print("-" * 60)

user = db.users.find_one({"email": email.lower()})
if user:
    print(f"Found user:")
    print(f"  _id: {user['_id']}")
    print(f"  name: {user.get('name')}")
    print(f"  email: {user.get('email')}")
    print(f"  firebase_uid: {user.get('firebase_uid', 'NOT SET')}")
else:
    print("User not found!")

# Also show all users
print("\n" + "=" * 60)
print("All users:")
for u in db.users.find():
    print(f"  {u.get('email')}: _id={u['_id']}, firebase_uid={u.get('firebase_uid', 'N/A')[:20] if u.get('firebase_uid') else 'N/A'}...")

client.close()
