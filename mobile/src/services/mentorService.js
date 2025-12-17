import api from './api';

/**
 * Send a mentor request to a user
 * @param {string} projectId - Project ID
 * @param {string} email - Email of the user to invite as mentor
 */
export const requestMentor = async (projectId, email) => {
    try {
        const response = await api.post(`/api/mentor/request/${projectId}`, { email });
        return response.data;
    } catch (error) {
        console.error('Request mentor error:', error);
        return { success: false, error: error.response?.data?.error || 'Failed to send mentor request' };
    }
};

/**
 * Respond to a mentor request (accept/decline)
 * @param {string} requestId - Request ID
 * @param {string} action - 'accept' or 'decline'
 */
export const respondToMentorRequest = async (requestId, action) => {
    try {
        const response = await api.post(`/api/mentor/respond/${requestId}`, { action });
        return response.data;
    } catch (error) {
        console.error('Respond to mentor request error:', error);
        return { success: false, error: error.response?.data?.error || 'Failed to respond to mentor request' };
    }
};

/**
 * Get all pending mentor requests for the current user
 */
export const getMentorRequests = async () => {
    try {
        const response = await api.get('/api/mentor/requests');
        return response.data;
    } catch (error) {
        console.error('Get mentor requests error:', error);
        return { success: false, mentor_requests: [], error: error.message };
    }
};
