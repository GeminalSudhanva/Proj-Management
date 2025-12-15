"""
Additional API endpoints for dashboard statistics
"""
from flask import jsonify
from flask_login import login_required, current_user
from bson import ObjectId

def add_dashboard_routes(app, mongo):
    """Add dashboard statistics endpoint"""
    
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
