@app.route("/api/project/<project_id>")
@login_required
def get_project_api(project_id):
    """API endpoint to get project details"""
    try:
        project = mongo.db.projects.find_one({"_id": ObjectId(project_id)})
        
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # Check if user has access
        if current_user.id not in project.get("team_members", []) and project.get("created_by") != current_user.id:
            return jsonify({"error": "Access denied"}), 403
        
        # Get tasks for this project
        tasks = list(mongo.db.tasks.find({"project_id": project_id}))
        
        # Calculate progress
        total_tasks = len(tasks)
        completed_tasks = len([task for task in tasks if task["status"] == "Done"])
        completion_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Convert project to JSON-serializable format with ALL fields
        project_dict = {
            "_id": str(project["_id"]),
            "title": project.get("title", ""),
            "description": project.get("description", ""),
            "course": project.get("course", ""),
            "deadline": project.get("deadline", ""),
            "created_by": project.get("created_by", ""),
            "team_members": project.get("team_members", []),
            "created_at": str(project.get("created_at", "")),
            "completion_percentage": round(completion_percentage, 2),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks
        }
        
        logger.info(f"Project API - created_by: {project_dict['created_by']}, team_members: {project_dict['team_members']}")
        return jsonify(project_dict)
    except Exception as e:
        logger.error(f"Error fetching project: {e}")
        return jsonify({"error": str(e)}), 500
