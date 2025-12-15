import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const createTask = async (projectId, taskData) => {
    try {
        // Flask expects form data
        const formData = new FormData();
        formData.append('title', taskData.title);
        formData.append('description', taskData.description || '');
        formData.append('status', taskData.status || 'To-do');
        formData.append('due_date', taskData.due_date || '');

        // Add assigned_to if present
        if (taskData.assigned_to) {
            formData.append('assigned_to', taskData.assigned_to);
        }

        const response = await api.post(API_ENDPOINTS.CREATE_TASK(projectId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Create task response:', response);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Create task error:', error);
        return { success: false, error: error.response?.data?.message || error.message || 'Failed to create task' };
    }
};

export const updateTaskStatus = async (taskId, status) => {
    try {
        const formData = new FormData();
        formData.append('status', status);

        const response = await api.post(API_ENDPOINTS.UPDATE_TASK_STATUS(taskId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to update task status' };
    }
};

export const editTask = async (taskId, taskData) => {
    try {
        const formData = new FormData();
        formData.append('title', taskData.title);
        formData.append('description', taskData.description || '');
        formData.append('status', taskData.status || 'To-do');
        formData.append('due_date', taskData.due_date || '');

        const response = await api.post(API_ENDPOINTS.EDIT_TASK(taskId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to edit task' };
    }
};

export const addComment = async (taskId, comment) => {
    try {
        const formData = new FormData();
        formData.append('comment', comment);

        const response = await api.post(API_ENDPOINTS.ADD_COMMENT(taskId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to add comment' };
    }
};

export const markTaskAsComplete = async (taskId) => {
    try {
        const response = await api.post(API_ENDPOINTS.COMPLETE_TASK(taskId));
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to mark task as complete'
        };
    }
};

export const deleteTask = async (taskId) => {
    try {
        const response = await api.post(API_ENDPOINTS.DELETE_TASK(taskId));
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to delete task'
        };
    }
};

export default {
    createTask,
    updateTaskStatus,
    editTask,
    addComment,
    markTaskAsComplete,
    deleteTask,
};
