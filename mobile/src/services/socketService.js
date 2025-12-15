import io from 'socket.io-client';
import { API_BASE_URL } from '../constants/config';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        if (this.socket && this.connected) {
            console.log('Socket already connected');
            return;
        }

        console.log('Connecting to Socket.IO server:', API_BASE_URL);

        this.socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('Socket.IO connected:', this.socket.id);
            this.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            this.connected = false;
        });

        this.socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });

        this.socket.on('connected', (data) => {
            console.log('Server message:', data.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // Global chat methods
    sendGlobalMessage(text, userId, userName) {
        if (!this.socket) return;

        this.socket.emit('send_global_message', {
            text,
            userId,
            userName,
        });
    }

    onNewGlobalMessage(callback) {
        if (!this.socket) return;
        this.socket.on('new_global_message', callback);
    }

    getGlobalMessages() {
        if (!this.socket) return;
        this.socket.emit('get_global_messages');
    }

    onGlobalMessagesHistory(callback) {
        if (!this.socket) return;
        this.socket.on('global_messages_history', callback);
    }

    // Project chat methods
    joinProjectRoom(projectId) {
        if (!this.socket) return;

        console.log('Joining project room:', projectId);
        this.socket.emit('join_project_room', { projectId });
    }

    leaveProjectRoom(projectId) {
        if (!this.socket) return;

        console.log('Leaving project room:', projectId);
        this.socket.emit('leave_project_room', { projectId });
    }

    sendProjectMessage(text, userId, userName, projectId) {
        if (!this.socket) return;

        this.socket.emit('send_project_message', {
            text,
            userId,
            userName,
            projectId,
        });
    }

    onNewProjectMessage(callback) {
        if (!this.socket) return;
        this.socket.on('new_project_message', callback);
    }

    getProjectMessages(projectId) {
        if (!this.socket) return;
        this.socket.emit('get_project_messages', { projectId });
    }

    onProjectMessagesHistory(callback) {
        if (!this.socket) return;
        this.socket.on('project_messages_history', callback);
    }

    // Delete message methods
    deleteGlobalMessage(messageId, userId) {
        if (!this.socket) return;

        this.socket.emit('delete_global_message', { messageId, userId });
    }

    deleteProjectMessage(messageId, userId, projectId) {
        if (!this.socket) return;

        this.socket.emit('delete_project_message', { messageId, userId, projectId });
    }

    onMessageDeleted(callback) {
        if (!this.socket) return;
        this.socket.on('message_deleted', callback);
    }

    // Cleanup
    removeAllListeners() {
        if (!this.socket) return;
        this.socket.removeAllListeners();
    }
}

// Export singleton instance
export default new SocketService();
