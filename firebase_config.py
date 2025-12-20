# Firebase Admin SDK Configuration for Flask Backend
# Handles Firebase token verification and user management

import os
import logging
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps
from flask import request, jsonify, g

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
_firebase_app = None

def init_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    global _firebase_app
    
    if _firebase_app:
        return _firebase_app
    
    try:
        # Option 1: Use service account JSON file (for local development)
        service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_PATH')
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized with service account file")
            return _firebase_app
        
        # Option 2: Use GOOGLE_APPLICATION_CREDENTIALS environment variable
        # (automatically used by Google Cloud services)
        if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
            _firebase_app = firebase_admin.initialize_app()
            logger.info("Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS")
            return _firebase_app
        
        # Option 3: Use service account JSON from environment variable
        service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
        if service_account_json:
            import json
            cred = credentials.Certificate(json.loads(service_account_json))
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized with service account JSON from env")
            return _firebase_app
        
        # Option 4: Default credentials (works on Google Cloud)
        _firebase_app = firebase_admin.initialize_app()
        logger.info("Firebase initialized with default credentials")
        return _firebase_app
        
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise


def verify_firebase_token(id_token):
    """
    Verify a Firebase ID token and return the decoded token.
    
    Args:
        id_token: The Firebase ID token to verify
        
    Returns:
        dict: The decoded token containing user info (uid, email, etc.)
        
    Raises:
        ValueError: If token is invalid or expired
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise ValueError("Token has expired")
    except auth.RevokedIdTokenError:
        raise ValueError("Token has been revoked")
    except auth.InvalidIdTokenError:
        raise ValueError("Invalid token")
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise ValueError(f"Token verification failed: {str(e)}")


def firebase_auth_required(f):
    """
    Decorator to require Firebase authentication for API endpoints.
    Sets g.firebase_user with the decoded token data.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        id_token = auth_header.replace('Bearer ', '')
        
        try:
            decoded_token = verify_firebase_token(id_token)
            g.firebase_user = decoded_token
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function


def firebase_auth_optional(f):
    """
    Decorator that attempts Firebase authentication but doesn't require it.
    Sets g.firebase_user if authenticated, None otherwise.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        g.firebase_user = None
        
        if auth_header.startswith('Bearer '):
            id_token = auth_header.replace('Bearer ', '')
            try:
                decoded_token = verify_firebase_token(id_token)
                g.firebase_user = decoded_token
            except Exception:
                pass  # Continue without authentication
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_or_create_user(firebase_uid, email, display_name=None):
    """
    Get existing user from MongoDB or create if not exists.
    Links Firebase UID to MongoDB user.
    
    Args:
        firebase_uid: Firebase user UID
        email: User email
        display_name: User display name
        
    Returns:
        dict: MongoDB user document
    """
    from app import mongo  # Import here to avoid circular imports
    
    # Try to find user by Firebase UID
    user = mongo.db.users.find_one({'firebase_uid': firebase_uid})
    
    if user:
        return user
    
    # Try to find by email (for migrated users)
    user = mongo.db.users.find_one({'email': email.lower()})
    
    if user:
        # Link Firebase UID to existing user
        mongo.db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'firebase_uid': firebase_uid}}
        )
        user['firebase_uid'] = firebase_uid
        return user
    
    # Create new user
    new_user = {
        'firebase_uid': firebase_uid,
        'email': email.lower(),
        'name': display_name or email.split('@')[0],
        'joined_projects': [],
        'created_at': __import__('datetime').datetime.utcnow()
    }
    
    result = mongo.db.users.insert_one(new_user)
    new_user['_id'] = result.inserted_id
    
    return new_user


def create_firebase_user(email, password, display_name=None):
    """
    Create a new Firebase user.
    Used for user migration from existing system.
    
    Args:
        email: User email
        password: User password
        display_name: Optional display name
        
    Returns:
        firebase_admin.auth.UserRecord
    """
    try:
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name,
            email_verified=False
        )
        return user
    except auth.EmailAlreadyExistsError:
        # User already exists in Firebase
        return auth.get_user_by_email(email)
    except Exception as e:
        logger.error(f"Failed to create Firebase user: {e}")
        raise


def delete_firebase_user(uid):
    """Delete a Firebase user by UID."""
    try:
        auth.delete_user(uid)
        logger.info(f"Deleted Firebase user: {uid}")
    except Exception as e:
        logger.error(f"Failed to delete Firebase user {uid}: {e}")
        raise
