import api from './api';
import { API_ENDPOINTS } from '../constants/config';

// Login user
export const login = async (email, password) => {
    try {
        // Flask expects form data
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await api.post(API_ENDPOINTS.LOGIN, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Flask sets session cookie automatically
        // Return user data (Flask might redirect, so handle both cases)
        return {
            success: true,
            user_id: response.data.user_id || 'user',
            name: response.data.name || email.split('@')[0],
            email: email,
        };
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.message || 'Invalid email or password');
    }
};

// Register user
export const register = async (name, email, password) => {
    try {
        // Flask expects form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);

        const response = await api.post(API_ENDPOINTS.REGISTER, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return {
            success: true,
            user_id: response.data.user_id || 'user',
            name: name,
            email: email,
        };
    } catch (error) {
        console.error('Register error:', error);
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

// Forgot password
export const forgotPassword = async (email) => {
    try {
        const formData = new FormData();
        formData.append('email', email);

        const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Change password
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
        const formData = new FormData();
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
        formData.append('confirm_password', confirmPassword);

        const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Update profile
export const updateProfile = async (name) => {
    try {
        const formData = new FormData();
        formData.append('name', name);

        const response = await api.post(API_ENDPOINTS.EDIT_PROFILE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default {
    login,
    register,
    forgotPassword,
    changePassword,
    updateProfile,
};
