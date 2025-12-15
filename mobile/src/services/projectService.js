import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const getProjects = async () => {
    try {
        const response = await api.get(API_ENDPOINTS.PROJECTS);
        // Backend now returns JSON array of projects
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Get projects error:', error);
        return { success: false, error: error.response?.data?.message || error.message || 'Failed to fetch projects' };
    }
};

export const getProjectDetails = async (projectId) => {
    try {
        console.log('[projectService] Fetching project:', projectId);
        const response = await api.get(API_ENDPOINTS.PROJECT_DETAILS(projectId));
        console.log('[projectService] Raw response:', response);
        console.log('[projectService] Response data:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('[projectService] Error:', error);
        console.error('[projectService] Error response:', error.response);
        return { success: false, error: error.response?.data?.message || 'Failed to fetch project details' };
    }
};

export const createProject = async (projectData) => {
    try {
        // Flask expects form data, not JSON
        const formData = new FormData();
        formData.append('title', projectData.title);
        formData.append('description', projectData.description || '');
        formData.append('course', projectData.course || '');
        formData.append('deadline', projectData.deadline || '');

        const response = await api.post(API_ENDPOINTS.CREATE_PROJECT, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Create project response:', response);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Create project error:', error);
        return { success: false, error: error.response?.data?.message || error.message || 'Failed to create project' };
    }
};

export const deleteProject = async (projectId) => {
    try {
        console.log('Deleting project:', projectId);

        // Flask expects POST with form-data
        const formData = new FormData();
        formData.append('confirm', 'true');

        const response = await api.post(API_ENDPOINTS.DELETE_PROJECT(projectId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Delete response:', response);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Delete project error:', error);
        return { success: false, error: error.response?.data?.message || 'Failed to delete project' };
    }
};

export const inviteMember = async (projectId, email) => {
    try {
        const formData = new FormData();
        formData.append('email', email);

        const response = await api.post(API_ENDPOINTS.INVITE_MEMBER(projectId), formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to invite member' };
    }
};

export const getProjectProgress = async (projectId) => {
    try {
        const response = await api.get(API_ENDPOINTS.PROJECT_PROGRESS(projectId));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch project progress' };
    }
};

export default {
    getProjects,
    getProjectDetails,
    createProject,
    deleteProject,
    inviteMember,
    getProjectProgress,
};
