import api from './api';

/**
 * Search across projects and tasks
 * @param {string} query - Search query (min 2 characters)
 * @returns {Promise<{success: boolean, projects: Array, tasks: Array}>}
 */
export const search = async (query) => {
    try {
        const response = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error('Search error:', error);
        return { success: false, projects: [], tasks: [], error: error.message };
    }
};
