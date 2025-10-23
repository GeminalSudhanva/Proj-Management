from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_pymongo import PyMongo
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "default-secret-key")

# MongoDB Configuration
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017/projectMngmt")
mongo = PyMongo(app)

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
    user_data = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

# Routes
@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        
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
        
        user_id = mongo.db.users.insert_one(new_user).inserted_id
        
        # Log in the new user
        user_data = mongo.db.users.find_one({"_id": user_id})
        user = User(user_data)
        login_user(user)
        
        flash("Registration successful!")
        return redirect(url_for("dashboard"))
    
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        user_data = mongo.db.users.find_one({"email": email})
        
        if user_data and check_password_hash(user_data["password_hash"], password):
            user = User(user_data)
            login_user(user)
            flash("Login successful!")
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid email or password.")
    
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("You have been logged out.")
    return redirect(url_for("index"))

@app.route("/dashboard")
@login_required
def dashboard():
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

@app.route("/project/<project_id>/invite", methods=["GET", "POST"])
@login_required
def invite_member(project_id):
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

@app.route("/invitations")
@login_required
def view_invitations():
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

@app.route("/invitation/<invitation_id>/respond", methods=["POST"])
@login_required
def respond_to_invitation(invitation_id):
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

@app.route("/project/<project_id>/task/create", methods=["GET", "POST"])
@login_required
def create_task(project_id):
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

@app.route("/task/<task_id>/update-status", methods=["POST"])
@login_required
def update_task_status(task_id):
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

@app.route("/task/<task_id>/comment", methods=["POST"])
@login_required
def add_comment(task_id):
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

@app.route("/task/<task_id>/edit", methods=["GET", "POST"])
@login_required
def edit_task(task_id):
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

@app.route("/project/<project_id>/progress")
@login_required
def project_progress(project_id):
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

if __name__ == "__main__":
    app.run(debug=True)