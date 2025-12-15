import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getToken } from '../utils/storage';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    // Note: withCredentials might not work properly in React Native
    // Flask session will still work via Set-Cookie headers
    // withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
                // You can dispatch logout action here
                console.log('Unauthorized - please login again');
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
