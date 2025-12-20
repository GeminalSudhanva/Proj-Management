"""
Migration script to fix project created_by and team_members fields.
Converts Firebase UIDs to MongoDB ObjectIds.

Run with:
$env:MONGO_URI="your_mongodb_uri"
python fix_project_ids.py
"""

from pymongo import MongoClient
from bson import ObjectId
import os
import sys

def is_firebase_uid(uid):
    """Check if a string looks like a Firebase UID (not a MongoDB ObjectId)"""
    if not uid:
        return False
    # Firebase UIDs are typically 28 characters and contain mixed case
    # MongoDB ObjectIds are 24 hex characters
    try:
        ObjectId(uid)
        return False  # It's a valid MongoDB ObjectId
    except:
        return True  # Not a valid ObjectId, probably Firebase UID

def fix_project_ids():
    """Fix project created_by and team_members fields to use MongoDB ObjectIds"""
    
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        print("ERROR: MONGO_URI environment variable not set")
        sys.exit(1)
    
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    db = client.projectMngmt
    
    print("=" * 50)
    print("Project ID Migration Tool")
    print("=" * 50)
    
    # Build a mapping of firebase_uid -> MongoDB _id
    print("\nBuilding Firebase UID to MongoDB ID mapping...")
    uid_map = {}
    users = list(db.users.find({"firebase_uid": {"$exists": True}}))
    for user in users:
        uid_map[user["firebase_uid"]] = str(user["_id"])
        print(f"  {user['firebase_uid'][:20]}... -> {user['_id']}")
    
    print(f"\nFound {len(uid_map)} users with Firebase UIDs")
    
    # Find projects that need fixing
    projects = list(db.projects.find())
    projects_to_fix = []
    
    for project in projects:
        created_by = project.get("created_by", "")
        needs_fix = False
        
        # Check created_by
        if is_firebase_uid(created_by):
            needs_fix = True
        
        # Check team_members
        for member in project.get("team_members", []):
            if is_firebase_uid(member):
                needs_fix = True
                break
        
        if needs_fix:
            projects_to_fix.append(project)
    
    print(f"Found {len(projects_to_fix)} projects that need fixing")
    
    if not projects_to_fix:
        print("\nNo projects need fixing!")
        return
    
    # Show what will be changed
    print("\nProjects to fix:")
    for project in projects_to_fix:
        print(f"  - {project['title']}")
        print(f"    created_by: {project.get('created_by', 'N/A')}")
    
    # Confirm
    response = input("\nProceed with migration? (yes/no): ")
    if response.lower() != 'yes':
        print("Migration cancelled")
        return
    
    # Fix projects
    fixed_count = 0
    for project in projects_to_fix:
        updates = {}
        
        # Fix created_by
        created_by = project.get("created_by", "")
        if is_firebase_uid(created_by):
            if created_by in uid_map:
                updates["created_by"] = uid_map[created_by]
                print(f"  {project['title']}: created_by {created_by[:15]}... -> {uid_map[created_by]}")
            else:
                print(f"  WARNING: No mapping found for {created_by}")
        
        # Fix team_members
        new_team_members = []
        team_changed = False
        for member in project.get("team_members", []):
            if is_firebase_uid(member):
                if member in uid_map:
                    new_team_members.append(uid_map[member])
                    team_changed = True
                else:
                    new_team_members.append(member)  # Keep original if no mapping
            else:
                new_team_members.append(member)
        
        if team_changed:
            updates["team_members"] = new_team_members
        
        # Apply updates
        if updates:
            db.projects.update_one(
                {"_id": project["_id"]},
                {"$set": updates}
            )
            fixed_count += 1
    
    print(f"\n{'=' * 50}")
    print(f"Migration Complete!")
    print(f"Fixed {fixed_count} projects")
    print(f"{'=' * 50}")
    
    client.close()

if __name__ == "__main__":
    fix_project_ids()
