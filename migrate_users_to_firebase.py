# Migration Script: Migrate Existing MongoDB Users to Firebase Authentication
# Run this script ONCE to migrate existing users
#
# IMPORTANT: Before running this script:
# 1. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable to your service account JSON file
# 2. Make sure your Flask app's MongoDB connection is configured
# 3. This script will NOT migrate passwords (Firebase doesn't support importing hashed passwords
#    in the free tier). Users will need to use "Forgot Password" after migration.
#
# Usage:
#   python migrate_users_to_firebase.py

import os
import sys
import logging
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
import firebase_admin
from firebase_admin import credentials, auth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MONGO_URI = os.environ.get('MONGO_URI')
SERVICE_ACCOUNT_PATH = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH', 'service-account.json')


def init_firebase():
    """Initialize Firebase Admin SDK."""
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        logger.error(f"Service account file not found: {SERVICE_ACCOUNT_PATH}")
        logger.error("Please set FIREBASE_SERVICE_ACCOUNT_PATH environment variable")
        sys.exit(1)
    
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin SDK initialized")


def get_mongo_connection():
    """Get MongoDB connection."""
    if not MONGO_URI:
        logger.error("MONGO_URI environment variable not set")
        sys.exit(1)
    
    client = MongoClient(MONGO_URI)
    db = client.projectMngmt
    return db


def migrate_user(db, user):
    """
    Migrate a single user to Firebase.
    
    Since we can't import password hashes to Firebase (without Firebase Admin SDK Enterprise),
    we create the user without a password. Users will need to use "Forgot Password" to set
    a new password, or we can send them a welcome email with password reset link.
    """
    email = user.get('email', '').lower()
    name = user.get('name', email.split('@')[0])
    
    if not email:
        logger.warning(f"Skipping user {user['_id']}: no email")
        return False
    
    try:
        # Check if user already exists in Firebase
        try:
            existing_user = auth.get_user_by_email(email)
            firebase_uid = existing_user.uid
            logger.info(f"User {email} already exists in Firebase (uid: {firebase_uid})")
        except auth.UserNotFoundError:
            # Create new Firebase user without password
            # User will need to use password reset
            firebase_user = auth.create_user(
                email=email,
                display_name=name,
                email_verified=False
            )
            firebase_uid = firebase_user.uid
            logger.info(f"Created Firebase user for {email} (uid: {firebase_uid})")
            
            # Send password reset email so user can set their password
            try:
                link = auth.generate_password_reset_link(email)
                logger.info(f"Password reset link for {email}: {link}")
                # TODO: Send this link via email to the user
            except Exception as e:
                logger.warning(f"Could not generate password reset link for {email}: {e}")
        
        # Update MongoDB user with Firebase UID
        db.users.update_one(
            {'_id': user['_id']},
            {
                '$set': {
                    'firebase_uid': firebase_uid,
                    'migrated_at': datetime.utcnow()
                }
            }
        )
        
        return True
        
    except auth.EmailAlreadyExistsError:
        logger.warning(f"Email {email} already exists in Firebase")
        return False
    except Exception as e:
        logger.error(f"Failed to migrate user {email}: {e}")
        return False


def main():
    """Main migration function."""
    logger.info("=" * 50)
    logger.info("MongoDB to Firebase User Migration")
    logger.info("=" * 50)
    
    # Initialize Firebase
    init_firebase()
    
    # Connect to MongoDB
    db = get_mongo_connection()
    
    # Get all users who haven't been migrated yet
    users = list(db.users.find({
        'firebase_uid': {'$exists': False}
    }))
    
    total = len(users)
    logger.info(f"Found {total} users to migrate")
    
    if total == 0:
        logger.info("No users to migrate. All users are already migrated.")
        return
    
    # Confirm before proceeding
    print(f"\nThis will migrate {total} users to Firebase.")
    print("Users will need to use 'Forgot Password' to set a new password.")
    confirm = input("Continue? (yes/no): ")
    
    if confirm.lower() != 'yes':
        logger.info("Migration cancelled")
        return
    
    # Migrate users
    success = 0
    failed = 0
    
    for i, user in enumerate(users, 1):
        logger.info(f"Migrating user {i}/{total}: {user.get('email', 'unknown')}")
        if migrate_user(db, user):
            success += 1
        else:
            failed += 1
    
    # Summary
    logger.info("=" * 50)
    logger.info("Migration Complete")
    logger.info(f"  Success: {success}")
    logger.info(f"  Failed: {failed}")
    logger.info("=" * 50)
    
    if failed > 0:
        logger.warning("Some users failed to migrate. Check logs for details.")
    
    logger.info("\nIMPORTANT: Migrated users will need to use 'Forgot Password'")
    logger.info("to set a new password before they can log in.")


if __name__ == '__main__':
    main()
