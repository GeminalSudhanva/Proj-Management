#!/usr/bin/env python3
import os
from app import app, mongo
from socketio_setup import init_socketio

if __name__ == '__main__':
    # Initialize Socket.IO
    socketio = init_socketio(app, mongo)
    
    # Create TTL index for global messages (auto-delete after 24 hours)
    try:
        mongo.db.global_messages.create_index('expiresAt', expireAfterSeconds=0)
        print("TTL index created for global_messages")
    except Exception as e:
        print(f"TTL index may already exist: {e}")
    
    port = int(os.environ.get('PORT', 5000))
    # Use socketio.run instead of app.run
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)