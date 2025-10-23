#!/usr/bin/env python3
"""
Fix password hashing issues for existing users
"""

import sys
import os
from bson.objectid import ObjectId

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def fix_existing_users():
    """Fix password hashing for existing users"""
    try:
        from app import mongo
        from werkzeug.security import generate_password_hash
        
        print("Fixing password hashing for existing users...")
        
        # Get all users
        users = list(mongo.db.users.find({}))
        
        if not users:
            print("No users found in database.")
            return
        
        print(f"Found {len(users)} users in database.")
        
        # Check each user's password hash
        for user in users:
            password_hash = user.get("password_hash", "")
            
            # If password hash starts with scrypt, it needs to be updated
            if password_hash.startswith("scrypt:"):
                print(f"Fixing password for user: {user.get('email', 'Unknown')}")
                
                # Set a temporary password that the user can change
                temp_password = "changeme123"
                new_hash = generate_password_hash(temp_password, method='sha256')
                
                # Update the user's password
                mongo.db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"password_hash": new_hash}}
                )
                
                print(f"  ✓ Updated password for {user.get('email', 'Unknown')}")
                print(f"  ⚠ Temporary password set to: {temp_password}")
                print(f"  ⚠ Please change this password after login!")
        
        print("\n✅ Password fixing completed!")
        print("\nFor users with temporary passwords:")
        print("1. Login with email and temporary password: changeme123")
        print("2. Change your password immediately after login")
        
    except Exception as e:
        print(f"Error fixing passwords: {e}")
        return False
    
    return True

def create_test_user():
    """Create a test user for testing"""
    try:
        from app import mongo
        from werkzeug.security import generate_password_hash
        
        # Check if test user already exists
        existing_user = mongo.db.users.find_one({"email": "test@example.com"})
        if existing_user:
            print("Test user already exists: test@example.com")
            return
        
        # Create test user
        test_user = {
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": generate_password_hash("test123", method='sha256'),
            "joined_projects": []
        }
        
        mongo.db.users.insert_one(test_user)
        print("✅ Test user created:")
        print("  Email: test@example.com")
        print("  Password: test123")
        
    except Exception as e:
        print(f"Error creating test user: {e}")

def main():
    """Main function"""
    print("Password Hash Fix Tool")
    print("=" * 30)
    
    # Fix existing users
    if fix_existing_users():
        print("\n" + "=" * 30)
        print("Creating test user for easy testing...")
        create_test_user()
        
        print("\n" + "=" * 30)
        print("✅ All done! You can now:")
        print("1. Login with existing users (use temporary password: changeme123)")
        print("2. Login with test user (email: test@example.com, password: test123)")
        print("3. Register new users (they will work normally)")
    else:
        print("❌ Failed to fix passwords")

if __name__ == "__main__":
    main() 