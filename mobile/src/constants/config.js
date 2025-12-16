// API Configuration
// Update this to your backend URL when deployed
export const API_BASE_URL = 'http://192.168.1.21:5000';
export const SOCKET_URL = 'http://192.168.1.21:5000';

// For testing on physical device, use your computer's IP address
// NOTE: Currently using your computer's IP address for physical device testing

export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    CHANGE_PASSWORD: '/change-password',

    // Profile
    EDIT_PROFILE: '/profile/edit',

    // Projects - Now using dedicated JSON API endpoint
    PROJECTS: '/api/projects',
    PROJECT_DETAILS: (id) => `/api/project/${id}`,
    CREATE_PROJECT: '/project/create',
    DELETE_PROJECT: (id) => `/project/${id}/delete`,
    INVITE_MEMBER: (id) => `/api/invite/${id}`,
    PROJECT_PROGRESS: (id) => `/project/${id}/progress`,

    // Tasks
    CREATE_TASK: (projectId) => `/project/${projectId}/task/create`,
    UPDATE_TASK_STATUS: (taskId) => `/task/${taskId}/update-status`,
    EDIT_TASK: (taskId) => `/task/${taskId}/edit`,
    ADD_COMMENT: (taskId) => `/task/${taskId}/comment`,
    COMPLETE_TASK: (taskId) => `/api/task/${taskId}/complete`,
    DELETE_TASK: (taskId) => `/api/task/${taskId}/delete`,

    // Invitations
    INVITATIONS: '/api/invitations',
    RESPOND_INVITATION: (id) => `/api/invitation/${id}/respond`,

    // Notifications
    NOTIFICATIONS: '/api/notifications',
    MARK_NOTIFICATION_READ: (id) => `/api/notifications/mark_read/${id}`,

    // Chat
    CHAT: '/chat',
};

export const STORAGE_KEYS = {
    AUTH_TOKEN: '@auth_token',
    USER_DATA: '@user_data',
    THEME: '@theme',
};

export default {
    API_BASE_URL,
    SOCKET_URL,
    API_ENDPOINTS,
    STORAGE_KEYS,
};
