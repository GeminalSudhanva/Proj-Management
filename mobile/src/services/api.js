import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import * as firebaseAuth from './firebaseAuthService';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add Firebase ID token
api.interceptors.request.use(
    async (config) => {
        try {
            // Get Firebase ID token for authentication
            const token = await firebaseAuth.getIdToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.warn('Failed to get auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - token expired or invalid
                console.log('Unauthorized - Firebase token may be expired');
                // Token will auto-refresh on next request
            } else if (status === 404) {
                console.log('Resource not found');
            } else if (status === 500) {
                console.log('Server error');
            }

            return Promise.reject(data);
        } else if (error.request) {
            // Request made but no response
            console.log('Network error - no response from server');
            return Promise.reject({ message: 'Network error. Please check your connection.' });
        } else {
            // Something else happened
            console.log('Error:', error.message);
            return Promise.reject({ message: error.message });
        }
    }
);

export default api;
