from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_pymongo import PyMongo
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import os
from datetime import datetime
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "default-secret-key")

# MongoDB Configuration
mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/projectMngmt")
logger.info(f"MongoDB URI: {mongo_uri}")
app.config["MONGO_URI"] = mongo_uri

try:
    mongo = PyMongo(app)
    logger.info("MongoDB connection initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MongoDB: {e}")
    mongo = None

# Initialize Login Manager
login_manager = LoginManager()
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

@app.route("/login", methods=["GET", "POST"])
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
                flash("Login successful!")
                return redirect(url_for("dashboard"))
            else:
                flash("Invalid email or password.")
        
        return render_template("login.html")
    except Exception as e:
        logger.error(f"Error in login route: {e}")
        flash(f"Login failed: {str(e)}")
        return render_template("login.html")

@app.route("/forgot-password", methods=["GET", "POST"])
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
            
            flash("Password reset instructions have been sent to your email.")
            flash("For demo purposes, your reset link is:")
            flash(f"http://127.0.0.1:5000/reset-password/{reset_token}")
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
        
        return render_template("dashboard.html", projects=all_projects)
    except Exception as e:
        logger.error(f"Error in dashboard route: {e}")
        return "Error loading dashboard", 500

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
                    "name": member["name"],
                    "email": member["email"]
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
        
        # Check if user is the project creator (leader)
        if project["created_by"] != current_user.id:
            flash("Only the project creator can delete this project.")
            return redirect(url_for("view_project", project_id=project_id))
        
        if request.method == "POST":
            # Get all tasks for this project
            tasks = list(mongo.db.tasks.find({"project_id": project_id}))
            
            # Check if all tasks are completed
            incomplete_tasks = [task for task in tasks if task["status"] != "Done"]
            
            if incomplete_tasks:
                flash("Cannot delete project. All tasks must be completed first.")
                return redirect(url_for("view_project", project_id=project_id))
            
            # Delete all tasks associated with this project
            mongo.db.tasks.delete_many({"project_id": project_id})
            
            # Delete all invitations for this project
            mongo.db.invitations.delete_many({"project_id": project_id})
            
            # Remove project from all users' joined_projects
            mongo.db.users.update_many(
                {"joined_projects": project_id},
                {"$pull": {"joined_projects": project_id}}
            )
            
            # Delete the project
            mongo.db.projects.delete_one({"_id": ObjectId(project_id)})
            
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
                    "name": member["name"]
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
        
        mongo.db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": new_status}}
        )
        
        return jsonify({"success": True, "message": "Task status updated"})
    except Exception as e:
        logger.error(f"Error in update_task_status route: {e}")
        return "Error updating task status", 500

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
            
            mongo.db.tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {
                    "title": title,
                    "description": description,
                    "assigned_to": assigned_to,
                    "due_date": due_date,
                    "status": status
                }}
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
                    "name": member["name"]
                })
        
        return render_template("edit_task.html", task=task, project=project, team_members=team_members)
    except Exception as e:
        logger.error(f"Error in edit_task route: {e}")
        return "Error editing task", 500

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
            }
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

if __name__ == "__main__":
    app.run(debug=True)