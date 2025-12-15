"""
Socket.IO setup for real-time chat functionality
Handles both global chat and project-specific chat rooms
"""
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
from datetime import datetime, timedelta
from bson import ObjectId

def init_socketio(app, mongo):
    """Initialize Socket.IO with the Flask app"""
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
    
    @socketio.on('connect')
    def handle_connect():
        print(f'Client connected: {request.sid}')
        emit('connected', {'message': 'Connected to chat server'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Client disconnected: {request.sid}')
    
    # Global chat handlers
    @socketio.on('send_global_message')
    def handle_global_message(data):
        """Handle global chat messages with 24-hour auto-delete"""
        try:
            message = {
                'text': data.get('text'),
                'user': {
                    '_id': data.get('userId'),
                    'name': data.get('userName'),
                },
                'createdAt': datetime.utcnow(),
                'expiresAt': datetime.utcnow() + timedelta(hours=24),
            }
            
            # Store in MongoDB with TTL index
            result = mongo.db.global_messages.insert_one(message)
            message['_id'] = str(result.inserted_id)
            message['createdAt'] = message['createdAt'].isoformat()
            message['expiresAt'] = message['expiresAt'].isoformat()
            
            # Broadcast to all connected clients
            emit('new_global_message', message, broadcast=True)
            print(f'Global message sent: {message["text"][:30]}...')
        except Exception as e:
            print(f'Error sending global message: {e}')
            emit('error', {'message': 'Failed to send message'})
    
    @socketio.on('get_global_messages')
    def handle_get_global_messages():
        """Fetch recent global messages (not expired)"""
        try:
            # Get messages that haven't expired
            messages = list(mongo.db.global_messages.find({
                'expiresAt': {'$gt': datetime.utcnow()}
            }).sort('createdAt', -1).limit(50))
            
            # Convert to JSON-serializable format
            for msg in messages:
                msg['_id'] = str(msg['_id'])
                msg['createdAt'] = msg['createdAt'].isoformat()
                msg['expiresAt'] = msg['expiresAt'].isoformat()
            
            emit('global_messages_history', messages)
        except Exception as e:
            print(f'Error fetching global messages: {e}')
            emit('error', {'message': 'Failed to fetch messages'})
    
    # Project chat handlers
    @socketio.on('join_project_room')
    def handle_join_project_room(data):
        """Join a project-specific chat room"""
        project_id = data.get('projectId')
        if project_id:
            join_room(f'project_{project_id}')
            print(f'Client {request.sid} joined project room: {project_id}')
            emit('joined_project_room', {'projectId': project_id})
    
    @socketio.on('leave_project_room')
    def handle_leave_project_room(data):
        """Leave a project-specific chat room"""
        project_id = data.get('projectId')
        if project_id:
            leave_room(f'project_{project_id}')
            print(f'Client {request.sid} left project room: {project_id}')
    
    @socketio.on('send_project_message')
    def handle_project_message(data):
        """Handle project-specific chat messages (permanent)"""
        try:
            project_id = data.get('projectId')
            message = {
                'text': data.get('text'),
                'user': {
                    '_id': data.get('userId'),
                    'name': data.get('userName'),
                },
                'projectId': project_id,
                'createdAt': datetime.utcnow(),
            }
            
            # Store in MongoDB (permanent, no expiry)
            result = mongo.db.project_messages.insert_one(message)
            message['_id'] = str(result.inserted_id)
            message['createdAt'] = message['createdAt'].isoformat()
            
            # Broadcast to project room only
            emit('new_project_message', message, room=f'project_{project_id}')
            print(f'Project message sent to {project_id}: {message["text"][:30]}...')
        except Exception as e:
            print(f'Error sending project message: {e}')
            emit('error', {'message': 'Failed to send message'})
    
    @socketio.on('get_project_messages')
    def handle_get_project_messages(data):
        """Fetch project chat history"""
        try:
            project_id = data.get('projectId')
            messages = list(mongo.db.project_messages.find({
                'projectId': project_id
            }).sort('createdAt', -1).limit(100))
            
            # Convert to JSON-serializable format
            for msg in messages:
                msg['_id'] = str(msg['_id'])
                msg['createdAt'] = msg['createdAt'].isoformat()
            
            emit('project_messages_history', messages)
        except Exception as e:
            print(f'Error fetching project messages: {e}')
            emit('error', {'message': 'Failed to fetch messages'})
    
    # Delete message handlers
    @socketio.on('delete_global_message')
    def handle_delete_global_message(data):
        """Delete a global chat message"""
        try:
            message_id = data.get('messageId')
            user_id = data.get('userId')
            
            # Find the message
            message = mongo.db.global_messages.find_one({'_id': ObjectId(message_id)})
            
            if not message:
                emit('error', {'message': 'Message not found'})
                return
            
            # Check if user owns the message
            if message['user']['_id'] != user_id:
                emit('error', {'message': 'You can only delete your own messages'})
                return
            
            # Delete the message
            mongo.db.global_messages.delete_one({'_id': ObjectId(message_id)})
            
            # Broadcast deletion to all clients
            emit('message_deleted', {'messageId': message_id, 'type': 'global'}, broadcast=True)
            print(f'Global message deleted: {message_id}')
        except Exception as e:
            print(f'Error deleting global message: {e}')
            emit('error', {'message': 'Failed to delete message'})
    
    @socketio.on('delete_project_message')
    def handle_delete_project_message(data):
        """Delete a project chat message"""
        try:
            message_id = data.get('messageId')
            user_id = data.get('userId')
            project_id = data.get('projectId')
            
            # Find the message
            message = mongo.db.project_messages.find_one({'_id': ObjectId(message_id)})
            
            if not message:
                emit('error', {'message': 'Message not found'})
                return
            
            # Check if user owns the message
            if message['user']['_id'] != user_id:
                emit('error', {'message': 'You can only delete your own messages'})
                return
            
            # Delete the message
            mongo.db.project_messages.delete_one({'_id': ObjectId(message_id)})
            
            # Broadcast deletion to project room
            emit('message_deleted', {'messageId': message_id, 'type': 'project'}, room=f'project_{project_id}')
            print(f'Project message deleted: {message_id}')
        except Exception as e:
            print(f'Error deleting project message: {e}')
            emit('error', {'message': 'Failed to delete message'})
    
    return socketio
