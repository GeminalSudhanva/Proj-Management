from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_pymongo import PyMongo
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_mail import Mail, Message
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import os
from datetime import datetime
from dotenv import load_dotenv
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
# Configure CORS to support credentials (session cookies) for mobile app
CORS(app, supports_credentials=True, origins=["*"], allow_headers=["Content-Type", "Authorization"])
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "default-secret-key")

# Rate Limiting Configuration - Protect against brute force attacks
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)
logger.info("Rate limiting enabled - protecting against brute force attacks")

# Flask-Mail Configuration
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER")

mail = Mail(app)

# MongoDB Configuration
mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/projectMngmt")
logger.info(f"MongoDB URI: {mongo_uri}")

# Fix the connection string - ensure proper database name
if mongo_uri and "mongodb+srv://" in mongo_uri:
    # Remove any existing parameters and ensure clean database name
    base_uri = mongo_uri.split("?")[0]
    # Remove any existing database name to avoid duplication
    if "/projectMngmt" in base_uri:
        base_uri = base_uri.replace("/projectMngmt", "")
    mongo_uri = f"{base_uri}/projectMngmt?retryWrites=true&w=majority"

app.config["MONGO_URI"] = mongo_uri

# Initialize MongoDB connection with multiple fallback methods
def initialize_mongodb():
    """Initialize MongoDB connection with multiple fallback methods"""
    import ssl
    import certifi
    from pymongo import MongoClient
    
    connection_methods = []
    
    # Method 1: Direct MongoClient with SSL disabled for certificate verification
    try:
        logger.info("Attempting Method 1: MongoClient with SSL CERT_NONE")
        client = MongoClient(
            mongo_uri,
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000
        )
        client.admin.command('ping')
        logger.info("Method 1 SUCCESS: MongoClient with SSL CERT_NONE")
        
        # Create a custom PyMongo-like wrapper
        class MongoWrapper:
            def __init__(self, client, db_name):
                self.cx = client
                self.db = client[db_name]
        
        mongo_instance = MongoWrapper(client, 'projectMngmt')
        mongo_instance.db.command('ping')
        connection_methods.append("MongoClient with SSL CERT_NONE - SUCCESS")
        return mongo_instance, connection_methods
    except Exception as e1:
        logger.error(f"Method 1 FAILED: {e1}")
        connection_methods.append(f"MongoClient with SSL CERT_NONE - FAILED: {str(e1)}")
    
    # Method 2: MongoClient with certifi
    try:
        logger.info("Attempting Method 2: MongoClient with certifi SSL")
        client = MongoClient(
            mongo_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000
        )
        client.admin.command('ping')
        
        class MongoWrapper:
            def __init__(self, client, db_name):
                self.cx = client
                self.db = client[db_name]
        
        mongo_instance = MongoWrapper(client, 'projectMngmt')
        mongo_instance.db.command('ping')
        logger.info("Method 2 SUCCESS: MongoClient with certifi SSL")
        connection_methods.append("MongoClient with certifi SSL - SUCCESS")
        return mongo_instance, connection_methods
    except Exception as e2:
        logger.error(f"Method 2 FAILED: {e2}")
        connection_methods.append(f"MongoClient with certifi SSL - FAILED: {str(e2)}")
    
    # Method 3: Standard PyMongo with Flask-PyMongo
    try:
        logger.info("Attempting Method 3: Standard PyMongo")
        app.config["MONGO_URI"] = mongo_uri + ("&" if "?" in mongo_uri else "?") + "tls=true&tlsAllowInvalidCertificates=true"
        mongo_instance = PyMongo(app)
        mongo_instance.db.command('ping')
        logger.info("Method 3 SUCCESS: Standard PyMongo")
        connection_methods.append("Standard PyMongo - SUCCESS")
        return mongo_instance, connection_methods
    except Exception as e3:
        logger.error(f"Method 3 FAILED: {e3}")
        connection_methods.append(f"Standard PyMongo - FAILED: {str(e3)}")
    
    logger.error("All MongoDB connection methods failed")
    return None, connection_methods

# Initialize MongoDB
mongo, connection_methods = initialize_mongodb()

if mongo is None:
    logger.error(f"Connection attempts: {connection_methods}")
else:
    logger.info("MongoDB connection established successfully")

# Initialize notifications collection
notifications_collection = mongo.db.notifications

# Initialize chat messages collection
chat_messages_collection = mongo.db.chat_messages

# Initialize scheduler
scheduler = BackgroundScheduler()

def check_due_dates():
    with app.app_context():
        logger.info("Running due date check...")
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        # Find tasks due tomorrow
        tasks_due_tomorrow = mongo.db.tasks.find({
            "due_date": {"$gte": today, "$lt": tomorrow},
            "status": {"$ne": "Done"}
        })

        for task in tasks_due_tomorrow:
            if task.get("assigned_to"):
                assigned_user_id = str(task["assigned_to"])
                project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
                if project:
                    task_link = url_for('view_project', project_id=str(project['_id']), _external=True) + f'#task-{task["_id"]}'
                    message = f"Reminder: The task '{task['title']}' is due tomorrow in project '{project['title']}'."
                    create_notification(assigned_user_id, message, 'due_date_approaching', task_link)
                else:
                    logger.warning(f"Project not found for task {task['_id']}. Cannot send due date notification.")
                logger.info(f"Due date notification sent for task {task['title']} to user {assigned_user_id}")

# Add the job to the scheduler
scheduler.add_job(check_due_dates, 'interval', hours=24)

def clean_old_chat_messages():
    with app.app_context():
        logger.info("Running old chat messages cleanup...")
        # Calculate the timestamp for 24 hours ago
        time_threshold = datetime.utcnow() - timedelta(hours=24)
        # Delete messages older than the threshold
        result = chat_messages_collection.delete_many({"timestamp": {"$lt": time_threshold}})
        logger.info(f"Deleted {result.deleted_count} old chat messages.")

# Add the chat cleanup job to the scheduler
scheduler.add_job(clean_old_chat_messages, 'interval', hours=24)

# Start the scheduler
scheduler.start()

# Shut down the scheduler when exiting the app
import atexit
atexit.register(lambda: scheduler.shutdown())

# Initialize Login Manager
login_manager = LoginManager()

# Set to store currently connected user IDs
connected_users = set()

def send_email_notification(recipient_email, subject, body):
    with app.app_context():
        try:
            msg = Message(subject, recipients=[recipient_email], body=body)
            mail.send(msg)
            logger.info(f"Email notification sent to {recipient_email} with subject: {subject}")
        except Exception as e:
            logger.error(f"Error sending email to {recipient_email}: {e}")

def create_notification(user_id, message, notification_type, link=None):
    try:
        notification = {
            "user_id": ObjectId(user_id),
            "message": message,
            "type": notification_type, # e.g., 'task_assigned', 'due_date_approaching', 'user_mentioned'
            "link": link,
            "read": False,
            "timestamp": datetime.utcnow()
        }
        notifications_collection.insert_one(notification)
        logger.info(f"Notification created for user {user_id}: {message}")

        # Emit a Socket.IO event for real-time notification
        socketio.emit('new_notification', {'user_id': str(user_id), 'message': message, 'link': link}, room=str(user_id))

        # Send email notification if applicable
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if user and user.get('email'):
            if notification_type == 'task_assigned':
                subject = f"Task Assigned: {message.split(': ')[1].split(' in project')[0]}"
                send_email_notification(user['email'], subject, message + f"\nView task: {link}")
            elif notification_type == 'user_mentioned':
                subject = f"You were mentioned in a comment: {message.split(': ')[1]}"
                send_email_notification(user['email'], subject, message + f"\nView comment: {link}")
            elif notification_type == 'due_date_approaching':
                subject = f"Task Due Soon: {message.split(': ')[1].split(' is due tomorrow')[0]}"
                send_email_notification(user['email'], subject, message + f"\nView task: {link}")

    except Exception as e:
        logger.error(f"Error creating notification for user {user_id}: {e}")
login_manager.init_app(app)
login_manager.login_view = "login"

# Context processor for template variables
@app.context_processor
def inject_current_year():
    return {"current_year": datetime.now().year}

# User Model for Flask-Login
class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data["_id"])
        self.name = user_data["name"]
        self.email = user_data["email"]
        self.joined_projects = user_data.get("joined_projects", [])

@login_manager.user_loader
def load_user(user_id):
    try:
        if mongo is None:
            return None
        user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return User(user_data)
        return None
    except Exception as e:
        logger.error(f"Error loading user: {e}")
        return None

# Handle JWT/Bearer token authentication for mobile API requests
@app.before_request
def handle_api_authentication():
    """Check for Authorization header and login user for API requests.
    
    Supports both:
    1. Firebase ID tokens (from mobile app with Firebase Auth)
    2. Legacy user_id tokens (for backward compatibility)
    """
    # Skip if user is already logged in via session
    if current_user.is_authenticated:
        return
    
    # Check for Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        
        # Try Firebase token verification first
        try:
            from firebase_config import verify_firebase_token, get_or_create_user, init_firebase
            
            # Initialize Firebase if not already done
            try:
                init_firebase()
            except Exception:
                pass  # Already initialized
            
            decoded_token = verify_firebase_token(token)
            firebase_uid = decoded_token['uid']
            email = decoded_token.get('email', '')
            display_name = decoded_token.get('name', '')
            
            # Get or create user in MongoDB
            user_data = get_or_create_user(firebase_uid, email, display_name)
            
            if user_data:
                user = User(user_data)
                login_user(user)
                logger.info(f"API auth: User {email} logged in via Firebase token")
                return
                
        except ImportError:
            logger.warning("Firebase config not available, falling back to legacy auth")
        except ValueError as e:
            logger.warning(f"Firebase token verification failed: {e}")
        except Exception as e:
            logger.error(f"Firebase auth error: {e}")
        
        # Fallback: Try legacy user_id token (for backward compatibility)
        try:
            user_id = token
            user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
            if user_data:
                user = User(user_data)
                login_user(user)
                logger.info(f"API auth: User {user.email} logged in via legacy Bearer token")
        except Exception as e:
            logger.error(f"Error in legacy API authentication: {e}")

# Routes
@app.route("/")
def index():
    try:
        if current_user.is_authenticated:
            return redirect(url_for("dashboard"))
        return render_template("index.html")
    except Exception as e:
        logger.error(f"Error in index route: {e}")
        return "Error loading page", 500




@app.route("/health")
def health_check():
    """Health check endpoint to test if app is running"""
    try:
        return jsonify({"status": "healthy", "mongo_connected": mongo is not None})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/test-mongo")
def test_mongo():
    """Test MongoDB connection and basic operations"""
    try:
        if mongo is None:
            return jsonify({"status": "error", "message": "MongoDB not connected"}), 500
        
        # Test database connection
        mongo.db.command('ping')
        
        # Test collection operations
        test_collection = mongo.db.test_collection
        test_doc = {"test": "data", "timestamp": datetime.now()}
        result = test_collection.insert_one(test_doc)
        test_collection.delete_one({"_id": result.inserted_id})
        
        return jsonify({
            "status": "success", 
            "message": "MongoDB connection and operations working",
            "mongo_uri": mongo_uri[:50] + "..." if len(mongo_uri) > 50 else mongo_uri
        })
    except Exception as e:
        logger.error(f"MongoDB test failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/register", methods=["GET", "POST"])
@limiter.limit("3 per minute")  # Prevent registration spam
def register():
    try:
        if request.method == "POST":
            logger.info("Register POST request received")
            name = request.form.get("name")
            email = request.form.get("email")
            password = request.form.get("password")
            
            logger.info(f"Registration attempt for email: {email}")
            
            # Check if MongoDB is connected
            if mongo is None:
                logger.error("MongoDB not connected")
                flash("Database connection error. Please try again.")
                return render_template("register.html")
            
            # Check if user already exists
            existing_user = mongo.db.users.find_one({"email": email})
            if existing_user:
                flash("Email already registered. Please login.")
                return redirect(url_for("login"))
            
            # Create new user
            hashed_password = generate_password_hash(password)
            new_user = {
                "name": name,
                "email": email,
                "password_hash": hashed_password,
                "joined_projects": []
            }
            
            logger.info("Attempting to insert new user")
            user_id = mongo.db.users.insert_one(new_user).inserted_id
            logger.info(f"User created with ID: {user_id}")
            
            # Log in the new user
            user_data = mongo.db.users.find_one({"_id": user_id})
            user = User(user_data)
            login_user(user)
            
            flash("Registration successful!")
            return redirect(url_for("dashboard"))
        
        return render_template("register.html")
    except Exception as e:
        logger.error(f"Error in register route: {e}")
        flash(f"Registration failed: {str(e)}")
        return render_template("register.html")

@app.route("/api/firebase-sync", methods=["POST"])
def firebase_sync():
    """
    Sync Firebase user to MongoDB.
    Called by mobile app after Firebase signup/login to ensure MongoDB user exists.
    """
    try:
        data = request.get_json() if request.is_json else {}
        
        firebase_uid = data.get('firebase_uid')
        email = data.get('email', '').lower()
        name = data.get('name', '')
        
        if not firebase_uid or not email:
            return jsonify({"success": False, "error": "firebase_uid and email are required"}), 400
        
        # Check if user already exists by firebase_uid
        existing_user = mongo.db.users.find_one({"firebase_uid": firebase_uid})
        if existing_user:
            return jsonify({
                "success": True, 
                "message": "User already synced",
                "user_id": str(existing_user["_id"]),
                "is_new": False
            })
        
        # Check if user exists by email (legacy user)
        existing_by_email = mongo.db.users.find_one({"email": email})
        if existing_by_email:
            # Link Firebase UID to existing user
            mongo.db.users.update_one(
                {"_id": existing_by_email["_id"]},
                {"$set": {"firebase_uid": firebase_uid}}
            )
            logger.info(f"Linked Firebase UID {firebase_uid} to existing user {email}")
            return jsonify({
                "success": True,
                "message": "Firebase linked to existing account",
                "user_id": str(existing_by_email["_id"]),
                "is_new": False
            })
        
        # Create new user
        new_user = {
            "firebase_uid": firebase_uid,
            "email": email,
            "name": name or email.split('@')[0],
            "joined_projects": [],
            "created_at": datetime.now()
        }
        
        result = mongo.db.users.insert_one(new_user)
        logger.info(f"Created new MongoDB user for Firebase UID {firebase_uid}")
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user_id": str(result.inserted_id),
            "is_new": True
        })
        
    except Exception as e:
        logger.error(f"Error in firebase_sync: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute")  # Prevent brute force attacks
def login():
    try:
        if request.method == "POST":
            logger.info("Login POST request received")
            email = request.form.get("email")
            password = request.form.get("password")
            
            logger.info(f"Login attempt for email: {email}")
            
            # Check if MongoDB is connected
            if mongo is None:
                logger.error("MongoDB not connected")
                flash("Database connection error. Please try again.")
                return render_template("login.html")
            
            user_data = mongo.db.users.find_one({"email": email})
            
            if user_data and check_password_hash(user_data["password_hash"], password):
                user = User(user_data)
                login_user(user)
                # Set updates_seen flag to False on successful login to show the alert
                mongo.db.users.update_one({'_id': ObjectId(user.id)}, {'$set': {'updates_seen': False}})
                
                # For mobile app, return JSON with user data
                if request.content_type and 'multipart/form-data' in request.content_type:
                    return jsonify({
                        'success': True,
                        'user_id': str(user_data['_id']),
                        'name': user_data.get('name', ''),
                        'email': user_data.get('email', ''),
                        'profile_picture': user_data.get('profile_picture', '')
                    })
                
                flash("Login successful!")
                # Set updates_seen and chat_feature_seen flags to False on successful login to show the alerts
                mongo.db.users.update_one({'_id': ObjectId(user.id)}, {'$set': {'updates_seen': False, 'chat_feature_seen': False}})
                return redirect(url_for("dashboard"))
            else:
                flash("Invalid email or password.")
        
        return render_template("login.html")
    except Exception as e:
        logger.error(f"Error in login route: {e}")
        flash(f"Login failed: {str(e)}")
        return render_template("login.html")

@app.route("/forgot-password", methods=["GET", "POST"])
@limiter.limit("3 per minute")  # Prevent password reset abuse
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email")
        
        # Check if user exists
        user_data = mongo.db.users.find_one({"email": email})
        
        if user_data:
            # Generate a simple reset token (in production, use a more secure method)
            import secrets
            reset_token = secrets.token_urlsafe(32)
            
            # Store reset token with expiration (24 hours)
            from datetime import datetime, timedelta
            reset_expires = datetime.now() + timedelta(hours=24)
            
            mongo.db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "reset_token": reset_token,
                        "reset_expires": reset_expires
                    }
                }
            )
            
            # Send email with reset link
            reset_link = url_for("reset_password", token=reset_token, _external=True)
            msg = Message(
                "Password Reset Request",
                sender=app.config["MAIL_DEFAULT_SENDER"],
                recipients=[email]
            )
            msg.body = f"To reset your password, visit the following link: {reset_link}"
            try:
                mail.send(msg)
                flash("Password reset instructions have been sent to your email.")
            except Exception as e:
                logger.error(f"Failed to send password reset email: {e}")
                flash("Failed to send password reset email. Please try again later.")
            return redirect(url_for("login"))
        else:
            flash("Email not found. Please check your email address.")
    
    return render_template("forgot_password.html")

@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    # Find user with this reset token
    user_data = mongo.db.users.find_one({
        "reset_token": token,
        "reset_expires": {"$gt": datetime.now()}
    })
    
    if not user_data:
        flash("Invalid or expired reset token.")
        return redirect(url_for("login"))
    
    if request.method == "POST":
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")
        
        if new_password != confirm_password:
            flash("Passwords do not match.")
            return render_template("reset_password.html", token=token)
        
        if len(new_password) < 6:
            flash("Password must be at least 6 characters long.")
            return render_template("reset_password.html", token=token)
        
        # Update password and clear reset token
        hashed_password = generate_password_hash(new_password, method='sha256')
        mongo.db.users.update_one(
            {"_id": user_data["_id"]},
            {
                "$set": {"password_hash": hashed_password},
                "$unset": {"reset_token": "", "reset_expires": ""}
            }
        )
        
        flash("Password has been reset successfully. You can now login with your new password.")
        return redirect(url_for("login"))
    
    return render_template("reset_password.html", token=token)

@app.route("/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    if request.method == "POST":
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")
        
        # Verify current password
        user_data = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
        if not check_password_hash(user_data["password_hash"], current_password):
            flash("Current password is incorrect.")
            return render_template("change_password.html")
        
        # Check if new passwords match
        if new_password != confirm_password:
            flash("New passwords do not match.")
            return render_template("change_password.html")
        
        # Check password length
        if len(new_password) < 6:
            flash("Password must be at least 6 characters long.")
            return render_template("change_password.html")
        
        # Update password
        hashed_password = generate_password_hash(new_password, method='sha256')
        mongo.db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"password_hash": hashed_password}}
        )
        
        flash("Password changed successfully!")
        return redirect(url_for("dashboard"))
    
    return render_template("change_password.html")

@app.route("/api/delete-account", methods=["POST", "DELETE"])
def delete_account():
    """Delete user account from Firebase and MongoDB, remove from all projects."""
    try:
        user_id = None
        user_data = None
        firebase_uid = None
        
        # Try to get user from session first (web or authenticated API)
        if current_user.is_authenticated:
            user_id = current_user.id
            user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        else:
            # For mobile app, try to get Firebase UID from request body or auth header
            data = request.get_json() if request.is_json else {}
            firebase_uid = data.get('firebase_uid')
            
            # Also try to verify Firebase token
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                try:
                    from firebase_config import verify_firebase_token, init_firebase
                    init_firebase()
                    decoded_token = verify_firebase_token(token)
                    firebase_uid = decoded_token['uid']
                except Exception as e:
                    logger.warning(f"Could not verify Firebase token for delete: {e}")
            
            if firebase_uid:
                # Look up user by Firebase UID
                user_data = mongo.db.users.find_one({"firebase_uid": firebase_uid})
                if user_data:
                    user_id = str(user_data["_id"])
        
        if not user_data:
            return jsonify({"success": False, "error": "User not found. Please login again."}), 404
        
        logger.info(f"Deleting account for user {user_id}, firebase_uid: {firebase_uid}")
        
        # 1. Delete Firebase user if linked
        firebase_uid = user_data.get('firebase_uid') or firebase_uid
        if firebase_uid:
            try:
                from firebase_config import init_firebase
                from firebase_admin import auth
                init_firebase()
                auth.delete_user(firebase_uid)
                logger.info(f"Deleted Firebase user: {firebase_uid}")
            except ImportError:
                logger.warning("Firebase Admin SDK not available")
            except Exception as e:
                logger.warning(f"Could not delete Firebase user: {e}")
        
        # 2. Remove user from all projects they're a member of
        mongo.db.projects.update_many(
            {"team_members": user_id},
            {"$pull": {"team_members": user_id}}
        )
        logger.info(f"Removed user from team memberships")
        
        # 3. Delete projects created by this user (or optionally transfer ownership)
        user_created_projects = list(mongo.db.projects.find({"created_by": user_id}))
        for project in user_created_projects:
            project_id = str(project["_id"])
            if len(project.get("team_members", [])) <= 1:
                mongo.db.tasks.delete_many({"project_id": project_id})
                mongo.db.projects.delete_one({"_id": project["_id"]})
                logger.info(f"Deleted project {project_id} (user was only member)")
            else:
                other_members = [m for m in project.get("team_members", []) if m != user_id]
                if other_members:
                    mongo.db.projects.update_one(
                        {"_id": project["_id"]},
                        {"$set": {"created_by": other_members[0]}}
                    )
                    logger.info(f"Transferred ownership of project {project_id}")
        
        # 4. Unassign user from any tasks
        mongo.db.tasks.update_many(
            {"assigned_to": ObjectId(user_id)},
            {"$set": {"assigned_to": None}}
        )
        
        # 5. Delete user's notifications
        mongo.db.notifications.delete_many({"user_id": ObjectId(user_id)})
        
        # 6. Delete user's chat messages
        mongo.db.chat_messages.delete_many({"user_id": user_id})
        
        # 7. Delete the user document from MongoDB
        mongo.db.users.delete_one({"_id": ObjectId(user_id)})
        logger.info(f"Deleted user document from MongoDB")
        
        # 8. Logout the user if authenticated via session
        if current_user.is_authenticated:
            logout_user()
        
        # Return success for API (mobile app)
        if request.content_type and ('application/json' in request.content_type or 'multipart/form-data' in request.content_type):
            return jsonify({"success": True, "message": "Account deleted successfully"})
        
        flash("Your account has been deleted successfully.")
        return redirect(url_for("index"))
        
    except Exception as e:
        logger.error(f"Error deleting account: {e}")
        if request.content_type and 'application/json' in request.content_type:
            return jsonify({"success": False, "error": str(e)}), 500
        flash(f"Error deleting account: {str(e)}")
        return redirect(url_for("dashboard"))

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect(url_for("index"))

@app.route("/dashboard")
@login_required
def dashboard():
    try:
        # Get projects where the user is a member
        user_projects = list(mongo.db.projects.find({"team_members": current_user.id}))
        
        # Get projects created by the user
        created_projects = list(mongo.db.projects.find({"created_by": current_user.id}))
        
        # Combine and remove duplicates
        all_projects = []
        project_ids = set()
        
        for project in user_projects + created_projects:
            if str(project["_id"]) not in project_ids:
                project_ids.add(str(project["_id"]))
                all_projects.append(project)

        # Calculate total team members (unique across all projects)
        all_team_member_ids = set()
        for project in all_projects:
            for member_id in project.get("team_members", []):
                all_team_member_ids.add(member_id)
        team_members_count = len(all_team_member_ids)

        # Calculate total tasks and completed tasks
        total_tasks = 0
        completed_tasks = 0
        for project in all_projects:
            project_tasks = list(mongo.db.tasks.find({"project_id": str(project["_id"])}))
            total_tasks += len(project_tasks)
            completed_tasks += len([task for task in project_tasks if task["status"] == "Done"])

        # Fetch user data to check for new feature alert status
        user_data = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
        show_new_feature_alert = not user_data.get('updates_seen', False) if user_data else False
        show_chat_feature_alert = not user_data.get('chat_feature_seen', False) if user_data else False

        # Ensure only one new feature alert is shown at a time, prioritize chat feature
        if show_chat_feature_alert:
            show_new_feature_alert = False

        # Render the template first
        rendered_template = render_template(
            "dashboard.html",
            projects=all_projects,
            team_members_count=team_members_count,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            show_new_feature_alert=show_new_feature_alert,
            show_chat_feature_alert=show_chat_feature_alert
        )

        # Mark alerts as seen after rendering the dashboard
        if user_data:
            if show_new_feature_alert:
                mongo.db.users.update_one({'_id': ObjectId(current_user.id)}, {'$set': {'updates_seen': True}})
            if show_chat_feature_alert:
                mongo.db.users.update_one({'_id': ObjectId(current_user.id)}, {'$set': {'chat_feature_seen': True}})
        
        return rendered_template
    except Exception as e:
        logger.error(f"Error in dashboard route: {e}")
        return "Error loading dashboard", 500

@app.route("/api/projects")
@login_required
def get_projects_api():
    """API endpoint for mobile app to get projects as JSON"""
    try:
        # Get projects where the user is a member
        user_projects = list(mongo.db.projects.find({"team_members": current_user.id}))
        
        # Get projects created by the user
        created_projects = list(mongo.db.projects.find({"created_by": current_user.id}))
        
        # Combine and remove duplicates
        all_projects = []
        project_ids = set()
        
        for project in user_projects + created_projects:
            if str(project["_id"]) not in project_ids:
                project_ids.add(str(project["_id"]))
                
                # Calculate progress for each project
                project_tasks = list(mongo.db.tasks.find({"project_id": str(project["_id"])}))
                total_tasks = len(project_tasks)
                completed_tasks = len([task for task in project_tasks if task["status"] == "Done"])
                completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
                
                # Convert ObjectId to string for JSON serialization
                project_dict = {
                    "_id": str(project["_id"]),
                    "title": project.get("title", ""),
                    "description": project.get("description", ""),
                    "course": project.get("course", ""),
                    "deadline": project.get("deadline", ""),
                    "created_by": project.get("created_by", ""),
                    "team_members": project.get("team_members", []),
                    "completion_percentage": round(completion_percentage, 2),
                    "total_tasks": total_tasks,
                    "completed_tasks": completed_tasks,
                }
                all_projects.append(project_dict)
        
        return jsonify(all_projects)
    except Exception as e:
        logger.error(f"Error in get_projects_api route: {e}")
        return jsonify({"error": "Failed to fetch projects"}), 500

@app.route("/api/search")
@login_required
def api_search():
    """Search across projects and tasks for the current user"""
    try:
        query = request.args.get('q', '').strip()
        
        if not query or len(query) < 2:
            return jsonify({'success': True, 'projects': [], 'tasks': []})
        
        user_id = current_user.id
        
        # Create regex pattern for case-insensitive search
        regex_pattern = {'$regex': query, '$options': 'i'}
        
        # Search projects where user is a member or creator
        projects = list(mongo.db.projects.find({
            '$and': [
                {'$or': [
                    {'created_by': user_id},
                    {'team_members': user_id}
                ]},
                {'$or': [
                    {'title': regex_pattern},
                    {'description': regex_pattern},
                    {'course': regex_pattern}
                ]}
            ]
        }))
        
        # Get project IDs for task search
        user_project_ids = [str(p['_id']) for p in mongo.db.projects.find({
            '$or': [
                {'created_by': user_id},
                {'team_members': user_id}
            ]
        })]
        
        # Search tasks in user's projects
        tasks = list(mongo.db.tasks.find({
            '$and': [
                {'project_id': {'$in': user_project_ids}},
                {'$or': [
                    {'title': regex_pattern},
                    {'description': regex_pattern}
                ]}
            ]
        }))
        
        # Format projects for JSON response
        projects_data = []
        for project in projects:
            project_tasks = list(mongo.db.tasks.find({"project_id": str(project["_id"])}))
            total_tasks = len(project_tasks)
            completed_tasks = len([t for t in project_tasks if t["status"] == "Done"])
            completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            projects_data.append({
                '_id': str(project['_id']),
                'title': project.get('title', ''),
                'description': project.get('description', ''),
                'course': project.get('course', ''),
                'deadline': project.get('deadline', ''),
                'completion_percentage': round(completion_percentage, 2),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks
            })
        
        # Format tasks for JSON response
        tasks_data = []
        for task in tasks:
            # Get project title for context
            project = mongo.db.projects.find_one({'_id': ObjectId(task['project_id'])})
            project_title = project.get('title', 'Unknown Project') if project else 'Unknown Project'
            
            tasks_data.append({
                '_id': str(task['_id']),
                'title': task.get('title', ''),
                'description': task.get('description', ''),
                'status': task.get('status', 'To-do'),
                'due_date': task.get('due_date', ''),
                'project_id': task.get('project_id', ''),
                'project_title': project_title
            })
        
        return jsonify({
            'success': True,
            'projects': projects_data,
            'tasks': tasks_data
        })
        
    except Exception as e:
        logger.error(f"Error in api_search route: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/api/dashboard/stats")
@login_required
def get_dashboard_stats():
    """Get dashboard statistics for the current user"""
    try:
        user_id = current_user.id
        
        # Get all projects where user is creator or member
        projects = list(mongo.db.projects.find({
            '$or': [
                {'created_by': user_id},
                {'team_members': user_id}
            ]
        }))
        
        # Get all tasks for user's projects
        project_ids = [str(p['_id']) for p in projects]
        all_tasks = list(mongo.db.tasks.find({
            'project_id': {'$in': project_ids}
        }))
        
        # Calculate task statistics
        total_tasks = len(all_tasks)
        completed_tasks = len([t for t in all_tasks if t.get('status') == 'Done'])
        in_progress_tasks = len([t for t in all_tasks if t.get('status') == 'In Progress'])
        todo_tasks = len([t for t in all_tasks if t.get('status') == 'To-do'])
        
        # Get unique team members across all projects
        team_members = set()
        for project in projects:
            # Add creator
            team_members.add(project.get('created_by'))
            # Add team members
            members = project.get('team_members', [])
            if isinstance(members, list):
                team_members.update(members)
        
        # Get recent projects (last 5)
        recent_projects = sorted(projects, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
        recent_projects_data = []
        for proj in recent_projects:
            # Get task count for this project
            proj_tasks = [t for t in all_tasks if t.get('project_id') == str(proj['_id'])]
            proj_completed = len([t for t in proj_tasks if t.get('status') == 'Done'])
            proj_total = len(proj_tasks)
            
            recent_projects_data.append({
                '_id': str(proj['_id']),
                'title': proj.get('title', ''),
                'completion_percentage': (proj_completed / proj_total * 100) if proj_total > 0 else 0,
                'total_tasks': proj_total,
                'completed_tasks': proj_completed
            })
        
        return jsonify({
            'success': True,
            'stats': {
                'total_projects': len(projects),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'todo_tasks': todo_tasks,
                'team_members_count': len(team_members),
                'recent_projects': recent_projects_data
            }
        })
    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route("/api/project/<project_id>")
@login_required
def get_project_api(project_id):
    """API endpoint to get project details"""
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            logger.warning(f"Project {project_id} not found in database")
            return jsonify({"error": "Project not found"}), 404
        
        # Check if user has access - creator OR team member
        is_creator = project.get("created_by") == current_user.id
        is_member = current_user.id in project.get("team_members", [])
        
        logger.info(f"Access check for project {project_id}: user={current_user.id}, is_creator={is_creator}, is_member={is_member}")
        
        if not (is_creator or is_member):
            logger.warning(f"Access denied for user {current_user.id} to project {project_id}")
            return jsonify({"error": "Access denied"}), 403
        
        # Get tasks for this project
        tasks = list(mongo.db.tasks.find({"project_id": project_id}))
        
        # Calculate progress
        total_tasks = len(tasks)
        completed_tasks = len([task for task in tasks if task["status"] == "Done"])
        completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Convert tasks to JSON-serializable format and populate assigned_to
        tasks_list = []
        for task in tasks:
            task_dict = {
                "_id": str(task["_id"]),
                "title": task.get("title", ""),
                "description": task.get("description", ""),
                "status": task.get("status", "To-do"),
                "due_date": task.get("due_date", ""),
                "project_id": task.get("project_id", ""),
                "created_by": task.get("created_by", ""),
                "created_at": str(task.get("created_at", ""))
            }
            
            # Populate assigned_to with user details
            if task.get("assigned_to"):
                assigned_user = mongo.db.users.find_one({"_id": ObjectId(task["assigned_to"])})
                if assigned_user:
                    task_dict["assigned_to"] = {
                        "id": str(assigned_user["_id"]),
                        "name": assigned_user.get("name", "Unknown User"),
                        "email": assigned_user.get("email", "")
                    }
                else:
                    task_dict["assigned_to"] = None
            else:
                task_dict["assigned_to"] = None
            
            tasks_list.append(task_dict)
        
        # Convert project to JSON-serializable format with ALL fields
        project_dict = {
            "_id": str(project["_id"]),
            "title": project.get("title", ""),
            "description": project.get("description", ""),
            "course": project.get("course", ""),
            "deadline": project.get("deadline", ""),
            "created_by": project.get("created_by", ""),
            "team_members": project.get("team_members", []),
            "mentors": project.get("mentors", []),  # Include mentors array
            "created_at": str(project.get("created_at", "")),
            "completion_percentage": round(completion_percentage, 2),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "tasks": tasks_list
        }
        
        logger.info(f"Returning project {project_id}: created_by={project_dict['created_by']}, team_members={project_dict['team_members']}, tasks_count={len(tasks_list)}")
        return jsonify(project_dict)
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/project/create", methods=["GET", "POST"])
@login_required
def create_project():
    if request.method == "POST":
        title = request.form.get("title")
        description = request.form.get("description")
        course = request.form.get("course")
        deadline = request.form.get("deadline")
        
        new_project = {
            "title": title,
            "description": description,
            "course": course,
            "deadline": deadline,
            "created_by": current_user.id,
            "team_members": [current_user.id],
            "mentors": [],  # Array of mentor user IDs
            "tasks": []
        }
        
        project_id = mongo.db.projects.insert_one(new_project).inserted_id
        
        # Update user's joined projects
        mongo.db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$addToSet": {"joined_projects": str(project_id)}}
        )
        
        flash("Project created successfully!")
        return redirect(url_for("view_project", project_id=project_id))
    
    return render_template("create_project.html")

@app.route("/project/<project_id>")
@login_required
def view_project(project_id):
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            flash("Project not found.")
            return redirect(url_for("dashboard"))
        
        # Check if user is a team member
        if current_user.id not in project["team_members"]:
            flash("You don't have access to this project.")
            return redirect(url_for("dashboard"))
        
        # Get all tasks for this project
        tasks = list(mongo.db.tasks.find({"project_id": project_id}))
        
        # Get team members' information
        team_members = []
        for member_id in project["team_members"]:
            member = mongo.db.users.find_one({"_id": ObjectId(member_id)})
            if member:
                team_members.append({
                    "id": str(member["_id"]),
                    "name": member.get("name", "Unknown User"),
                    "email": member.get("email", "N/A")
                })
        
        # Organize tasks by status
        todo_tasks = [task for task in tasks if task["status"] == "To-do"]
        in_progress_tasks = [task for task in tasks if task["status"] == "In Progress"]
        done_tasks = [task for task in tasks if task["status"] == "Done"]
        
        return render_template(
            "project.html",
            project=project,
            tasks=tasks,
            todo_tasks=todo_tasks,
            in_progress_tasks=in_progress_tasks,
            done_tasks=done_tasks,
            team_members=team_members
        )
    except Exception as e:
        logger.error(f"Error in view_project route: {e}")
        return "Error loading project", 500

@app.route("/project/<project_id>/delete", methods=["GET", "POST"])
@login_required
def delete_project(project_id):
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            flash("Project not found.")
            return redirect(url_for("dashboard"))
        
        # Check if user is the project creator (leader) OR a mentor
        is_creator = project["created_by"] == current_user.id
        is_mentor = current_user.id in project.get("mentors", [])
        
        if not (is_creator or is_mentor):
            flash("Only the project creator or a mentor can delete this project.")
            return redirect(url_for("view_project", project_id=project_id))
        
        if request.method == "POST":
            # Get all tasks for this project
            tasks = list(mongo.db.tasks.find({"project_id": project_id}))
            
            # For mobile app, skip the incomplete tasks check
            is_mobile = request.content_type and 'multipart/form-data' in request.content_type
            
            # Check if all tasks are completed (only for web)
            if not is_mobile:
                incomplete_tasks = [task for task in tasks if task["status"] != "Done"]
                
                if incomplete_tasks:
                    flash("Cannot delete project. All tasks must be completed first.")
                    return redirect(url_for("view_project", project_id=project_id))
            
            # Delete all tasks associated with this project
            mongo.db.tasks.delete_many({"project_id": project_id})
            
            # Delete all invitations for this project
            mongo.db.invitations.delete_many({"project_id": project_id})
            
            # Delete all chat messages for this project
            mongo.db.chat_messages.delete_many({"room_id": project_id, "room_type": "team"})
            
            # Delete all notifications related to this project
            mongo.db.notifications.delete_many({"project_id": project_id})
            
            # Remove project from all users' joined_projects
            mongo.db.users.update_many(
                {"joined_projects": project_id},
                {"$pull": {"joined_projects": project_id}}
            )
            
            # Delete the project
            mongo.db.projects.delete_one({"_id": ObjectId(project_id)})
            
            # For mobile app, return JSON
            if request.content_type and 'multipart/form-data' in request.content_type:
                return jsonify({'success': True, 'message': 'Project deleted successfully'})
            
            flash("Project deleted successfully!")
            return redirect(url_for("dashboard"))
        
        # Get tasks for confirmation
        tasks = list(mongo.db.tasks.find({"project_id": project_id}))
        incomplete_tasks = [task for task in tasks if task["status"] != "Done"]
        
        return render_template("delete_project.html", project=project, incomplete_tasks=incomplete_tasks)
    except Exception as e:
        logger.error(f"Error in delete_project route: {e}")
        return "Error deleting project", 500

@app.route("/project/<project_id>/invite", methods=["GET", "POST"])
@login_required
def invite_member(project_id):
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            flash("Project not found.")
            return redirect(url_for("dashboard"))
        
        # Check if user is the project creator
        if project["created_by"] != current_user.id:
            flash("Only the project creator can invite members.")
            return redirect(url_for("view_project", project_id=project_id))
        
        if request.method == "POST":
            email = request.form.get("email")
            
            # Find user by email
            invited_user = mongo.db.users.find_one({"email": email})
            
            if not invited_user:
                flash("User with this email not found.")
                return redirect(url_for("invite_member", project_id=project_id))
            
            invited_user_id = str(invited_user["_id"])
            
            # Check if user is already a team member
            if invited_user_id in project["team_members"]:
                flash("User is already a team member.")
                return redirect(url_for("invite_member", project_id=project_id))
            
            # Create invitation
            invitation = {
                "project_id": project_id,
                "project_title": project["title"],
                "invited_by": current_user.id,
                "invited_user": invited_user_id,
                "status": "pending",
                "created_at": datetime.now()
            }
            
            mongo.db.invitations.insert_one(invitation)
            
            flash(f"Invitation sent to {email}")
            return redirect(url_for("view_project", project_id=project_id))
        
        return render_template("invite_member.html", project=project)
    except Exception as e:
        logger.error(f"Error in invite_member route: {e}")
        return "Error inviting member", 500

# API endpoint for mobile app invitations
@app.route("/api/invite/<project_id>", methods=["POST"])
@login_required
def api_invite_member(project_id):
    """API endpoint for mobile app to invite members to a project"""
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            return jsonify({"success": False, "error": "Project not found"}), 404
        
        # Check if user is the project creator
        if project["created_by"] != current_user.id:
            return jsonify({"success": False, "error": "Only the project creator can invite members"}), 403
        
        # Get email from form data
        email = request.form.get("email")
        
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
        
        # Find user by email
        invited_user = mongo.db.users.find_one({"email": email})
        
        if not invited_user:
            return jsonify({"success": False, "error": "User with this email not found"}), 404
        
        invited_user_id = str(invited_user["_id"])
        
        # Check if user is already a team member
        if invited_user_id in project.get("team_members", []):
            return jsonify({"success": False, "error": "User is already a team member"}), 400
        
        # Check if user is the project creator
        if invited_user_id == project["created_by"]:
            return jsonify({"success": False, "error": "Cannot invite the project creator"}), 400
        
        # Create invitation in invitations collection
        invitation = {
            "project_id": project_id,
            "project_title": project["title"],
            "invited_by": current_user.id,
            "invited_by_name": current_user.name,
            "invited_user": invited_user_id,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        mongo.db.invitations.insert_one(invitation)
        
        # Create notification for the invited user
        notification = {
            "user_id": invited_user_id,
            "type": "project_invitation",
            "message": f"You have been invited to join the project '{project['title']}' by {current_user.name}",
            "project_id": project_id,
            "project_title": project["title"],
            "invited_by": current_user.id,
            "invited_by_name": current_user.name,
            "read": False,
            "created_at": datetime.utcnow()
        }
        mongo.db.notifications.insert_one(notification)
        
        logger.info(f"User {invited_user['name']} invited to project {project['title']} by {current_user.name}")
        
        return jsonify({
            "success": True, 
            "message": f"{invited_user['name']} has been invited to the project!"
        })
    except Exception as e:
        logger.error(f"Error in api_invite_member route: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ============== MENTOR API ENDPOINTS ==============

@app.route("/api/mentor/request/<project_id>", methods=["POST"])
@login_required
def api_request_mentor(project_id):
    """Send a mentor request to a user (by email)"""
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            return jsonify({"success": False, "error": "Project not found"}), 404
        
        # Only project creator can invite mentors
        if project["created_by"] != current_user.id:
            return jsonify({"success": False, "error": "Only the project creator can invite mentors"}), 403
        
        # Get email from form data or JSON
        email = request.form.get("email") or request.json.get("email")
        
        if not email:
            return jsonify({"success": False, "error": "Email is required"}), 400
        
        # Find user by email
        mentor_user = mongo.db.users.find_one({"email": email})
        
        if not mentor_user:
            return jsonify({"success": False, "error": "User with this email not found"}), 404
        
        mentor_user_id = str(mentor_user["_id"])
        
        # Check if user is already a mentor
        if mentor_user_id in project.get("mentors", []):
            return jsonify({"success": False, "error": "User is already a mentor for this project"}), 400
        
        # Check if user is the project creator
        if mentor_user_id == project["created_by"]:
            return jsonify({"success": False, "error": "Project creator cannot be a mentor"}), 400
        
        # Check if there's already a pending mentor request for this user
        existing_request = mongo.db.invitations.find_one({
            "project_id": project_id,
            "invited_user": mentor_user_id,
            "type": "mentor_request",
            "status": "pending"
        })
        
        if existing_request:
            return jsonify({"success": False, "error": "A mentor request is already pending for this user"}), 400
        
        # Create mentor request invitation
        mentor_request = {
            "project_id": project_id,
            "project_title": project["title"],
            "invited_by": current_user.id,
            "invited_by_name": current_user.name,
            "invited_user": mentor_user_id,
            "type": "mentor_request",  # Distinguishes from regular invitations
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        mongo.db.invitations.insert_one(mentor_request)
        
        # Create notification for the mentor
        notification = {
            "user_id": mentor_user_id,
            "type": "mentor_request",
            "message": f"You have been invited to be a mentor for the project '{project['title']}' by {current_user.name}",
            "project_id": project_id,
            "project_title": project["title"],
            "invited_by": current_user.id,
            "invited_by_name": current_user.name,
            "read": False,
            "created_at": datetime.utcnow()
        }
        mongo.db.notifications.insert_one(notification)
        
        logger.info(f"Mentor request sent to {mentor_user['name']} for project {project['title']} by {current_user.name}")
        
        return jsonify({
            "success": True,
            "message": f"Mentor request sent to {mentor_user['name']}!"
        })
    except Exception as e:
        logger.error(f"Error in api_request_mentor route: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/mentor/respond/<request_id>", methods=["POST"])
@login_required
def api_respond_mentor_request(request_id):
    """Accept or decline a mentor request"""
    try:
        mentor_request = mongo.db.invitations.find_one({
            "_id": ObjectId(request_id),
            "type": "mentor_request"
        })
        
        if not mentor_request:
            return jsonify({"success": False, "error": "Mentor request not found"}), 404
        
        # Verify the request is for the current user
        if mentor_request["invited_user"] != current_user.id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        action = request.json.get("action")  # 'accept' or 'decline'
        
        if action == "accept":
            # Add user to project mentors array
            mongo.db.projects.update_one(
                {"_id": ObjectId(mentor_request["project_id"])},
                {"$addToSet": {"mentors": current_user.id}}
            )
            
            # Update request status
            mongo.db.invitations.update_one(
                {"_id": ObjectId(request_id)},
                {"$set": {"status": "accepted"}}
            )
            
            # Notify project creator
            project = mongo.db.projects.find_one({"_id": ObjectId(mentor_request["project_id"])})
            if project:
                notification = {
                    "user_id": project["created_by"],
                    "type": "mentor_accepted",
                    "message": f"{current_user.name} has accepted to be a mentor for '{project['title']}'",
                    "project_id": mentor_request["project_id"],
                    "project_title": project["title"],
                    "read": False,
                    "created_at": datetime.utcnow()
                }
                mongo.db.notifications.insert_one(notification)
            
            logger.info(f"User {current_user.name} accepted mentor request for project {mentor_request['project_id']}")
            return jsonify({"success": True, "message": "You are now a mentor for this project"})
        
        elif action == "decline":
            # Update request status
            mongo.db.invitations.update_one(
                {"_id": ObjectId(request_id)},
                {"$set": {"status": "declined"}}
            )
            
            logger.info(f"User {current_user.name} declined mentor request for project {mentor_request['project_id']}")
            return jsonify({"success": True, "message": "Mentor request declined"})
        else:
            return jsonify({"success": False, "error": "Invalid action"}), 400
        
    except Exception as e:
        logger.error(f"Error responding to mentor request: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/mentor/requests")
@login_required
def api_get_mentor_requests():
    """Get all pending mentor requests for the current user"""
    try:
        mentor_requests = list(mongo.db.invitations.find({
            "invited_user": current_user.id,
            "type": "mentor_request",
            "status": "pending"
        }))
        
        # Convert ObjectId to string
        for req in mentor_requests:
            req["_id"] = str(req["_id"])
        
        return jsonify({"success": True, "mentor_requests": mentor_requests})
    except Exception as e:
        logger.error(f"Error fetching mentor requests: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# API endpoint to get invitations for current user
@app.route("/api/invitations")
@login_required
def api_get_invitations():
    """Get all pending invitations for the current user"""
    try:
        invitations = list(mongo.db.invitations.find({
            "invited_user": current_user.id,
            "status": "pending"
        }))
        
        # Convert ObjectId to string
        for inv in invitations:
            inv["_id"] = str(inv["_id"])
        
        return jsonify(invitations)
    except Exception as e:
        logger.error(f"Error fetching invitations: {e}")
        return jsonify({"error": str(e)}), 500

# API endpoint to respond to invitation (accept/decline)
@app.route("/api/invitation/<invitation_id>/respond", methods=["POST"])
@login_required
def api_respond_invitation(invitation_id):
    """Accept or decline a project invitation"""
    try:
        invitation = mongo.db.invitations.find_one({"_id": ObjectId(invitation_id)})
        
        if not invitation:
            return jsonify({"success": False, "error": "Invitation not found"}), 404
        
        # Verify the invitation is for the current user
        if invitation["invited_user"] != current_user.id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403
        
        action = request.json.get("action")  # 'accept' or 'decline'
        
        if action == "accept":
            # Add user to project team members
            mongo.db.projects.update_one(
                {"_id": ObjectId(invitation["project_id"])},
                {"$addToSet": {"team_members": current_user.id}}
            )
            
            # Update invitation status
            mongo.db.invitations.update_one(
                {"_id": ObjectId(invitation_id)},
                {"$set": {"status": "accepted"}}
            )
            
            logger.info(f"User {current_user.name} accepted invitation to project {invitation['project_id']}")
            return jsonify({"success": True, "message": "Invitation accepted"})
            
        elif action == "decline":
            # Update invitation status
            mongo.db.invitations.update_one(
                {"_id": ObjectId(invitation_id)},
                {"$set": {"status": "declined"}}
            )
            
            logger.info(f"User {current_user.name} declined invitation to project {invitation['project_id']}")
            return jsonify({"success": True, "message": "Invitation declined"})
        else:
            return jsonify({"success": False, "error": "Invalid action"}), 400
            
    except Exception as e:
        logger.error(f"Error responding to invitation: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/invitations")
@login_required
def view_invitations():
    try:
        # Get all pending invitations for the current user
        invitations = list(mongo.db.invitations.find({
            "invited_user": current_user.id,
            "status": "pending"
        }))
        
        # Get project and inviter details for each invitation
        for invitation in invitations:
            project = mongo.db.projects.find_one({"_id": ObjectId(invitation["project_id"])})
            inviter = mongo.db.users.find_one({"_id": ObjectId(invitation["invited_by"])})
            
            invitation["project"] = project
            invitation["inviter"] = inviter
        
        return render_template("invitations.html", invitations=invitations)
    except Exception as e:
        logger.error(f"Error in view_invitations route: {e}")
        return "Error loading invitations", 500

@app.route("/invitation/<invitation_id>/respond", methods=["POST"])
@login_required
def respond_to_invitation(invitation_id):
    try:
        invitation = mongo.db.invitations.find_one({"_id": ObjectId(invitation_id)})
        
        if not invitation or invitation["invited_user"] != current_user.id:
            flash("Invalid invitation.")
            return redirect(url_for("view_invitations"))
        
        response = request.form.get("response")
        
        if response == "accept":
            # Add user to project team members
            mongo.db.projects.update_one(
                {"_id": ObjectId(invitation["project_id"])},
                {"$addToSet": {"team_members": current_user.id}}
            )
            
            # Add project to user's joined projects
            mongo.db.users.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$addToSet": {"joined_projects": invitation["project_id"]}}
            )
            
            # Update invitation status
            mongo.db.invitations.update_one(
                {"_id": ObjectId(invitation_id)},
                {"$set": {"status": "accepted"}}
            )
            
            flash("Invitation accepted. You are now a team member.")
            return redirect(url_for("view_project", project_id=invitation["project_id"]))
        else:
            # Update invitation status
            mongo.db.invitations.update_one(
                {"_id": ObjectId(invitation_id)},
                {"$set": {"status": "declined"}}
            )
            
            flash("Invitation declined.")
            return redirect(url_for("view_invitations"))
    except Exception as e:
        logger.error(f"Error in respond_to_invitation route: {e}")
        return "Error responding to invitation", 500

@app.route("/project/<project_id>/task/create", methods=["GET", "POST"])
@login_required
def create_task(project_id):
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            flash("Project not found.")
            return redirect(url_for("dashboard"))
        
        # Check if user is the project creator (leader)
        if current_user.id != project["created_by"]:
            flash("Only the project creator can create and assign tasks.")
            return redirect(url_for("view_project", project_id=project_id))
        
        if request.method == "POST":
            title = request.form.get("title")
            description = request.form.get("description")
            assigned_to = request.form.get("assigned_to")
            due_date = request.form.get("due_date")
            
            logger.info(f"Creating task: title={title}, assigned_to={assigned_to}, project_id={project_id}")
            
            new_task = {
                "title": title,
                "description": description,
                "assigned_to": assigned_to,
                "status": "To-do",
                "due_date": due_date,
                "project_id": project_id,
                "created_by": current_user.id,
                "created_at": datetime.now(),
                "comments": []
            }
            
            task_id = mongo.db.tasks.insert_one(new_task).inserted_id

            # Create notification for assigned user if assigned_to is present
            if assigned_to:
                assigned_user = mongo.db.users.find_one({"_id": ObjectId(assigned_to)})
                if assigned_user:
                    project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
                    task_link = url_for('view_project', project_id=project_id, _external=True) + f'#task-{task_id}'
                    message = f"You have been assigned a new task: {title} in project {project['title']}."
                    create_notification(assigned_to, message, 'task_assigned', task_link)
            
            # Update project's tasks list
            mongo.db.projects.update_one(
                {"_id": ObjectId(project_id)},
                {"$push": {"tasks": str(task_id)}}
            )
            
            flash("Task created successfully!")
            return redirect(url_for("view_project", project_id=project_id))
        
        # Get team members for assignment dropdown
        team_members = []
        for member_id in project["team_members"]:
            member = mongo.db.users.find_one({"_id": ObjectId(member_id)})
            if member:
                team_members.append({
                    "id": str(member["_id"]),
                    "name": member.get("name", "Unknown User")
                })
        
        return render_template("create_task.html", project=project, team_members=team_members)
    except Exception as e:
        logger.error(f"Error in create_task route: {e}")
        return "Error creating task", 500

@app.route("/task/<task_id>/update-status", methods=["POST"])
@login_required
def update_task_status(task_id):
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
        
        if not task:
            return jsonify({"success": False, "message": "Task not found"})
        
        project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
        
        # Check if user is a team member
        if current_user.id not in project["team_members"]:
            return jsonify({"success": False, "message": "You don't have access to this task"})
        
        new_status = request.json.get("status")
        if new_status not in ["To-do", "In Progress", "Done"]:
            return jsonify({"success": False, "message": "Invalid status"})
        # Update task status
        mongo.db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": new_status}}
        )
        
        # Create notification if task is completed
        if new_status == "Done":
            task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
            project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
            
            # Notify project creator
            if project and project.get("created_by") != current_user.id:
                notification = {
                    "user_id": project["created_by"],
                    "type": "task_completed",
                    "message": f"Task '{task['title']}' has been completed in project '{project['title']}'",
                    "task_id": task_id,
                    "task_title": task['title'],
                    "project_id": task["project_id"],
                    "project_title": project['title'],
                    "completed_by": current_user.id,
                    "completed_by_name": current_user.name,
                    "read": False,
                    "created_at": datetime.utcnow()
                }
                mongo.db.notifications.insert_one(notification)
                logger.info(f"Task '{task['title']}' completed by {current_user.name}")
        
        return jsonify({"success": True, "message": "Task status updated"})
    except Exception as e:
        logger.error(f"Error updating task status: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# Mobile API endpoint to mark task as complete
@app.route("/api/task/<task_id>/complete", methods=["POST"])
@login_required
def api_complete_task(task_id):
    """Mark a task as complete (mobile app)"""
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return jsonify({"success": False, "message": "Task not found"}), 404
        
        # Check if user is assigned to this task
        if task.get("assigned_to") != current_user.id:
            return jsonify({"success": False, "message": "You are not assigned to this task"}), 403
        
        # Check if task is already done
        if task.get("status") == "Done":
            return jsonify({"success": False, "message": "Task is already completed"}), 400
        
        # Update task status to Done
        mongo.db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "Done"}}
        )
        
        # Get project details
        project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
        if not project:
            return jsonify({"success": False, "message": "Project not found"}), 404
        
        # Calculate updated progress
        all_tasks = list(mongo.db.tasks.find({"project_id": task["project_id"]}))
        total_tasks = len(all_tasks)
        completed_tasks = len([t for t in all_tasks if t.get("status") == "Done"])
        progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Create notification for project creator
        if project.get("created_by") and project["created_by"] != current_user.id:
            user = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
            notification = {
                "user_id": project["created_by"],
                "type": "task_completed",
                "message": f"Team member {user.get('name', 'Unknown')} has completed task '{task['title']}'. Please review.",
                "task_id": task_id,
                "task_title": task['title'],
                "project_id": task["project_id"],
                "project_title": project['title'],
                "completed_by": current_user.id,
                "completed_by_name": user.get('name', 'Unknown'),
                "read": False,
                "created_at": datetime.utcnow()
            }
            mongo.db.notifications.insert_one(notification)
            logger.info(f"Task '{task['title']}' marked as complete by {user.get('name')}")
        
        return jsonify({
            "success": True,
            "message": "Task marked as complete",
            "task": {
                "_id": str(task["_id"]),
                "status": "Done"
            },
            "progress": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "progress_percentage": round(progress_percentage, 2)
            }
        })
    except Exception as e:
        logger.error(f"Error completing task: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# Mobile API endpoint to delete a task
@app.route("/api/task/<task_id>/delete", methods=["POST"])
@login_required
def api_delete_task(task_id):
    """Delete a task (mobile app) - only project creator can delete"""
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return jsonify({"success": False, "message": "Task not found"}), 404
        
        # Get project details
        project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
        if not project:
            return jsonify({"success": False, "message": "Project not found"}), 404
        
        # Check if user is the project creator
        if project.get("created_by") != current_user.id:
            return jsonify({"success": False, "message": "Only project creator can delete tasks"}), 403
        
        # Delete the task
        mongo.db.tasks.delete_one({"_id": ObjectId(task_id)})
        
        # Remove task from project's tasks list
        mongo.db.projects.update_one(
            {"_id": ObjectId(task["project_id"])},
            {"$pull": {"tasks": task_id}}
        )
        
        logger.info(f"Task '{task['title']}' deleted by {current_user.name}")
        
        return jsonify({
            "success": True,
            "message": "Task deleted successfully"
        })
    except Exception as e:
        logger.error(f"Error deleting task: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# API endpoint to get user profile data
@app.route("/api/profile")
@login_required
def api_get_profile():
    """Get current user's profile data"""
    try:
        user_data = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
        
        if not user_data:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        return jsonify({
            "success": True,
            "user": {
                "id": str(user_data["_id"]),
                "name": user_data.get("name", ""),
                "email": user_data.get("email", ""),
                "profile_picture": user_data.get("profile_picture", "")
            }
        })
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# API endpoint to upload profile picture
@app.route("/api/profile/upload-picture", methods=["POST"])
@login_required
def upload_profile_picture():
    """Upload user profile picture (base64 encoded)"""
    try:
        data = request.get_json()
        profile_picture = data.get("profile_picture")
        
        if not profile_picture:
            return jsonify({"success": False, "message": "No image provided"}), 400
        
        # Update user's profile picture
        mongo.db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"profile_picture": profile_picture}}
        )
        
        logger.info(f"Profile picture updated for user {current_user.id}")
        
        return jsonify({
            "success": True,
            "message": "Profile picture updated successfully",
            "profile_picture": profile_picture
        })
    except Exception as e:
        logger.error(f"Error uploading profile picture: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# API endpoint to remove profile picture
@app.route("/api/profile/remove-picture", methods=["POST"])
@login_required
def remove_profile_picture():
    """Remove user profile picture"""
    try:
        # Remove profile picture from user
        mongo.db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$unset": {"profile_picture": ""}}
        )
        
        logger.info(f"Profile picture removed for user {current_user.id}")
        
        return jsonify({
            "success": True,
            "message": "Profile picture removed successfully"
        })
    except Exception as e:
        logger.error(f"Error removing profile picture: {e}")
        return jsonify({"success": False, "error": str(e)}), 500



# API endpoint to get user details by ID
@app.route("/api/user/<user_id>")
@login_required
def api_get_user(user_id):
    """Get user details by ID"""
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": str(user["_id"]),
            "name": user.get("name", "Unknown User"),
            "email": user.get("email", "")
        })
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/task/<task_id>/comment", methods=["POST"])
@login_required
def add_comment(task_id):
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
        
        if not task:
            flash("Task not found.")
            return redirect(url_for("dashboard"))
        
        project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
        
        # Check if user is a team member
        if current_user.id not in project["team_members"]:
            flash("You don't have access to this task.")
            return redirect(url_for("dashboard"))
        
        comment_text = request.form.get("comment")
        
        if not comment_text:
            flash("Comment cannot be empty.")
            return redirect(url_for("view_project", project_id=task["project_id"]))
        
        comment = {
            "text": comment_text,
            "created_by": current_user.id,
            "created_at": datetime.now()
        }
        
        mongo.db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$push": {"comments": comment}}
        )

        # Check for user mentions in the comment
        mentioned_users = re.findall(r'@(\w+)', comment_text)
        if mentioned_users:
            for username in mentioned_users:
                user = mongo.db.users.find_one({"name": username})
                if user:
                    comment_link = url_for('view_project', project_id=task["project_id"], _external=True) + f'#task-{task_id}'
                    message = f"You were mentioned in a comment on task '{task['title']}'."
                    create_notification(str(user['_id']), message, 'user_mentioned', comment_link)
        
        flash("Comment added successfully!")
        return redirect(url_for("view_project", project_id=task["project_id"]))
    except Exception as e:
        logger.error(f"Error in add_comment route: {e}")
        return "Error adding comment", 500

@app.route("/task/<task_id>/edit", methods=["GET", "POST"])
@login_required
def edit_task(task_id):
    try:
        task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})
        
        if not task:
            flash("Task not found.")
            return redirect(url_for("dashboard"))
        
        project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
        
        # Check if user is a team member
        if current_user.id not in project["team_members"]:
            flash("You don't have access to this task.")
            return redirect(url_for("dashboard"))
        
        if request.method == "POST":
            title = request.form.get("title")
            description = request.form.get("description")
            assigned_to = request.form.get("assigned_to")
            due_date = request.form.get("due_date")
            status = request.form.get("status")
            
            # Get the existing task to compare assigned_to
            existing_task = mongo.db.tasks.find_one({"_id": ObjectId(task_id)})

            update_fields = {
                "title": title,
                "description": description,
                "due_date": datetime.strptime(due_date, "%Y-%m-%d") if due_date else None,
                "status": status
            }

            # Handle assigned_to change and notification
            if assigned_to:
                update_fields["assigned_to"] = ObjectId(assigned_to)
                if existing_task.get("assigned_to") != ObjectId(assigned_to):
                    assigned_user = mongo.db.users.find_one({"_id": ObjectId(assigned_to)})
                    if assigned_user:
                        project = mongo.db.projects.find_one({"_id": ObjectId(task["project_id"])})
                        task_link = url_for('view_project', project_id=task["project_id"], _external=True) + f'#task-{task_id}'
                        message = f"You have been assigned task: {title} in project {project['title']}."
                        create_notification(assigned_to, message, 'task_assigned', task_link)
            else:
                update_fields["assigned_to"] = None

            mongo.db.tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": update_fields}
            )

            flash("Task updated successfully!")
            return redirect(url_for("view_project", project_id=task["project_id"]))
        
        # Get team members for assignment dropdown
        team_members = []
        for member_id in project["team_members"]:
            member = mongo.db.users.find_one({"_id": ObjectId(member_id)})
            if member:
                team_members.append({
                    "id": str(member["_id"]),
                    "name": member.get("name", "Unknown User")
                })
        
        return render_template("edit_task.html", task=task, project=project, team_members=team_members)
    except Exception as e:
        logger.error(f"Error in edit_task route: {e}")
        return "Error editing task", 500


@app.route("/api/notifications")
@login_required
def get_notifications():
    try:
        # Get all notifications for the current user (both read and unread)
        notifications = list(mongo.db.notifications.find({"user_id": current_user.id}).sort("created_at", -1))
        
        result = []
        for notification in notifications:
            notif_dict = {
                "_id": str(notification["_id"]),
                "user_id": notification.get("user_id"),
                "type": notification.get("type", ""),
                "message": notification.get("message", ""),
                "read": notification.get("read", False),
                "created_at": notification.get("created_at").isoformat() if notification.get("created_at") else "",
                "project_id": notification.get("project_id", ""),
                "task_id": notification.get("task_id", "")
            }
            result.append(notif_dict)
        
        logger.info(f"Fetched {len(result)} notifications for user {current_user.id}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error fetching notifications for user {current_user.id}: {e}")
        return jsonify({"error": "Error fetching notifications"}), 500

@app.route("/api/notifications/mark_read/<notification_id>", methods=["POST"])
@login_required
def mark_notification_read(notification_id):
    try:
        mongo.db.notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": current_user.id},
            {"$set": {"read": True}}
        )
        logger.info(f"Notification {notification_id} marked as read by user {current_user.id}")
        return jsonify({"success": True, "message": "Notification marked as read"})
    except Exception as e:
        logger.error(f"Error marking notification {notification_id} as read: {e}")
        return jsonify({"error": "Error marking notification as read"}), 500

@app.route('/chat')
@login_required
def chat():
    room_id = request.args.get('room_id', 'general') # Get room_id from query parameter, default to 'general'
    room_type = request.args.get('room_type', 'global') # Get room_type from query parameter, default to 'global'

    current_room_name = 'Global Chat'
    if room_type == 'team' and room_id != 'general':
        project = mongo.db.projects.find_one({'_id': ObjectId(room_id)})
        if project:
            current_room_name = f'Team: {project["title"]}'

    # Mark chat notifications as read for the current user
    notifications_collection.update_many(
        {"user_id": ObjectId(current_user.id), "type": "chat_message", "read": False},
        {"$set": {"read": True}}
    )

    import json
    # Fetch historical messages for the specific room and type
    historical_messages_cursor = chat_messages_collection.find({'room_id': room_id, 'room_type': room_type}).sort('timestamp', 1)
    historical_messages = []
    for message in historical_messages_cursor:
        message['_id'] = str(message['_id'])
        if 'timestamp' in message and isinstance(message['timestamp'], datetime):
            message['timestamp'] = message['timestamp'].isoformat()
        historical_messages.append(message)

    historical_messages_json = json.dumps(historical_messages)

    return render_template('chat.html', historical_messages_json=historical_messages_json, current_room_id=room_id, current_room_type=room_type, current_room_name=current_room_name)


@app.route("/api/updates_seen", methods=["POST"])
@login_required
def mark_updates_seen():
    try:
        mongo.db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"updates_seen": True}}
        )
        return jsonify({"success": True, "message": "Updates marked as seen"})
    except Exception as e:
        logger.error(f"Error marking updates as seen for user {current_user.id}: {e}")
        return jsonify({"error": "Error marking updates as seen"}), 500

@app.route("/api/get_updates")
@login_required
def get_updates():
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
        if user and not user.get('updates_seen', False):
            updates_content = {
                "title": "Recent Updates!",
                "message": "We've added new features:\n- Conditional navigation links based on authentication.\n- Improved notification system with email alerts.\n- Scheduled task due date reminders.",
                "version": "1.0"
            }
            return jsonify(updates_content)
        else:
            return jsonify({})
    except Exception as e:
        logger.error(f"Error fetching updates: {e}")
        return jsonify({"error": "Error fetching updates"}), 500

@app.route("/profile/edit", methods=["GET", "POST"])
@login_required
def edit_profile():
    try:
        user_data = mongo.db.users.find_one({"_id": ObjectId(current_user.id)})
        if request.method == "POST":
            new_name = request.form.get("name")
            if new_name:
                mongo.db.users.update_one(
                    {"_id": ObjectId(current_user.id)},
                    {"$set": {"name": new_name}}
                )
                flash("Profile updated successfully!")
                return redirect(url_for("dashboard"))
            else:
                flash("Name cannot be empty.")
        return render_template("edit_profile.html", user=user_data)
    except Exception as e:
        logger.error(f"Error in edit_profile route: {e}")
        return "Error loading profile edit page", 500

@app.route("/project/<project_id>/progress")
@login_required
def project_progress(project_id):
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            flash("Project not found.")
            return redirect(url_for("dashboard"))
        
        # Check if user is a team member
        if current_user.id not in project["team_members"]:
            flash("You don't have access to this project.")
            return redirect(url_for("dashboard"))
        
        # Get all tasks for this project
        tasks = list(mongo.db.tasks.find({"project_id": project_id}))
        
        # Calculate progress statistics
        total_tasks = len(tasks)
        completed_tasks = sum(1 for task in tasks if task["status"] == "Done")
        pending_tasks = total_tasks - completed_tasks
        
        completion_percentage = 0
        if total_tasks > 0:
            completion_percentage = (completed_tasks / total_tasks) * 100
        
        # Get team members' information and their completed tasks
        team_members = []
        for member_id in project["team_members"]:
            member = mongo.db.users.find_one({"_id": ObjectId(member_id)})
            if member:
                member_completed_tasks = sum(1 for task in tasks if task["assigned_to"] == str(member["_id"]) and task["status"] == "Done")
                member_total_tasks = sum(1 for task in tasks if task["assigned_to"] == str(member["_id"]))
                
                member_completion_percentage = 0
                if member_total_tasks > 0:
                    member_completion_percentage = (member_completed_tasks / member_total_tasks) * 100
                
                team_members.append({
                    "id": str(member["_id"]),
                    "name": member["name"],
                    "completed_tasks": member_completed_tasks,
                    "total_tasks": member_total_tasks,
                    "completion_percentage": member_completion_percentage
                })
        
        return render_template(
            "project_progress.html",
            project=project,
            tasks=tasks,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            completion_percentage=completion_percentage,
            team_members=team_members
        )
    except Exception as e:
        logger.error(f"Error in project_progress route: {e}")
        return "Error loading project progress", 500

@app.route("/debug")
def debug_info():
    """Debug endpoint to check app configuration"""
    try:
        debug_info = {
            "mongo_connected": mongo is not None,
            "mongo_uri_length": len(mongo_uri) if mongo_uri else 0,
            "mongo_uri_preview": mongo_uri[:30] + "..." if mongo_uri and len(mongo_uri) > 30 else mongo_uri,
            "secret_key_set": bool(app.config.get("SECRET_KEY")),
            "secret_key_length": len(app.config.get("SECRET_KEY", "")) if app.config.get("SECRET_KEY") else 0,
            "environment_variables": {
                "MONGO_URI": "SET" if os.environ.get("MONGO_URI") else "NOT SET",
                "SECRET_KEY": "SET" if os.environ.get("SECRET_KEY") else "NOT SET"
            },
            "connection_methods_tried": connection_methods
        }
        
        if mongo is not None:
            try:
                # Test MongoDB connection
                mongo.db.command('ping')
                debug_info["mongo_ping"] = "SUCCESS"
            except Exception as e:
                debug_info["mongo_ping"] = f"FAILED: {str(e)}"
        else:
            debug_info["mongo_ping"] = "NOT CONNECTED"
        
        return jsonify(debug_info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Mobile PWA Configuration
app.config['PREFERRED_URL_SCHEME'] = 'https'
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000  # 1 year cache for static files

# Add mobile-specific routes
@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json')

@app.route('/sw.js')
def service_worker():
    return app.send_static_file('sw.js')

@socketio.on('connect')
def handle_connect():
    if current_user.is_authenticated:
        user_id = str(current_user.get_id())
        join_room(user_id)
        connected_users.add(user_id) # Add user to the set of connected users
        print(f'Client connected: {current_user.name} (ID: {user_id})')
        # Emit updated online users list to all clients
        emit('online_users', get_online_users_list(), broadcast=True)
    else:
        print('Anonymous client connected')

@socketio.on('disconnect')
def handle_disconnect():
    if current_user.is_authenticated:
        user_id = str(current_user.get_id())
        leave_room(user_id)
        if user_id in connected_users:
            connected_users.remove(user_id) # Remove user from the set
        print(f'Client disconnected: {current_user.name} (ID: {user_id})')
        # Emit updated online users list to all clients
        emit('online_users', get_online_users_list(), broadcast=True)
    else:
        print('Anonymous client disconnected')

@socketio.on('send_message')
def handle_send_message(data):
    if current_user.is_authenticated:
        message_content = data['message']
        room_id = data.get('room_id', 'general')  # Default to 'general' if not provided
        room_type = data.get('room_type', 'global') # Default to 'global' if not provided
        username = current_user.name
        user_id = str(current_user.get_id())
        timestamp = datetime.utcnow()

        # Save message to MongoDB
        chat_messages_collection.insert_one({
            'sender_id': user_id,
            'sender_username': username,
            'message': message_content,
            'timestamp': timestamp,
            'room_id': room_id,
            'room_type': room_type
        })
        emit('receive_message', {'username': username, 'message': message_content, 'timestamp': str(timestamp), 'room_id': room_id}, room=room_id)

        # Create notifications for other users in the room who are not currently connected to that room
        # This part needs more sophisticated logic to only notify users who are part of the room
        # and not currently active in it. For now, it will notify all users not connected to any chat.
        all_users = mongo.db.users.find({})
        for user in all_users:
            if str(user['_id']) != user_id and str(user['_id']) not in connected_users: # Simplified notification logic
                notification_message = "New messages"
                chat_link = url_for('chat', _external=True)
                create_notification(str(user['_id']), notification_message, 'chat_message', chat_link)
    else:
        print('Anonymous user tried to send a message.')

@socketio.on('join_room')
def handle_join_room(data):
    room_id = data['room_id']
    room_type = data['room_type']
    if current_user.is_authenticated:
        join_room(room_id)
        user_id = str(current_user.get_id())
        print(f'User {current_user.name} (ID: {user_id}) joined room {room_id} of type {room_type}')
        # Optionally, emit a message to the room that a user has joined
        emit('status_message', {'msg': f'{current_user.name} has joined the chat.'}, room=room_id)

        # Fetch and emit historical messages for the joined room
        historical_messages_cursor = chat_messages_collection.find({'room_id': room_id, 'room_type': room_type}).sort('timestamp', 1)
        historical_messages = []
        for message in historical_messages_cursor:
            message['_id'] = str(message['_id'])
            if 'timestamp' in message and isinstance(message['timestamp'], datetime):
                message['timestamp'] = message['timestamp'].isoformat()
            historical_messages.append(message)
        emit('historical_messages', historical_messages, room=request.sid)

@socketio.on('leave_room')
def handle_leave_room(data):
    room_id = data['room_id']
    if current_user.is_authenticated:
        leave_room(room_id)
        user_id = str(current_user.get_id())
        print(f'User {current_user.name} (ID: {user_id}) left room {room_id}')
        # Optionally, emit a message to the room that a user has left
        emit('status_message', {'msg': f'{current_user.name} has left the chat.'}, room=room_id)

@socketio.on('request_online_users')
def get_online_users_list():
    online_users = []
    for user_id in connected_users:
        user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if user:
            online_users.append({'id': str(user['_id']), 'username': user['name']})
    return online_users

@socketio.on('request_online_users')
def handle_request_online_users():
    emit('online_users', get_online_users_list())

@socketio.on('request_chat_rooms')
def handle_request_chat_rooms(data):
    chat_rooms = [{'id': 'general', 'name': 'Global Chat', 'type': 'global'}]
    if current_user.is_authenticated:
        # Fetch projects the user is a member of
        user_projects = mongo.db.projects.find({
            "$or": [
                {"created_by": str(current_user.get_id())},
                {"team_members": str(current_user.get_id())}
            ]
        })
        for project in user_projects:
            chat_rooms.append({'id': str(project['_id']), 'name': f'Team: {project["title"]}', 'type': 'team'})
    emit('chat_rooms', chat_rooms)

if __name__ == '__main__':
    socketio.run(app, debug=True)