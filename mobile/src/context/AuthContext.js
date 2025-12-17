import React, { createContext, useState, useContext, useEffect } from 'react';
import { storeToken, getToken, removeToken, storeUserData, getUserData, removeUserData } from '../utils/storage';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is logged in on app start
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getToken();
            const userData = await getUserData();

            if (token && userData) {
                setUser(userData);
                setIsAuthenticated(true);

                // Refresh user data from server to get latest profile_picture
                refreshUserFromServer(userData);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh user data from server (for profile picture sync)
    const refreshUserFromServer = async (currentUserData) => {
        try {
            const api = require('../services/api').default;
            const response = await api.get('/api/profile');

            if (response.data.success && response.data.user) {
                const freshUserData = {
                    id: currentUserData.id,
                    name: response.data.user.name,
                    email: response.data.user.email,
                    profile_picture: response.data.user.profile_picture || null,
                };

                // Only update if profile_picture is different
                if (freshUserData.profile_picture !== currentUserData.profile_picture) {
                    await storeUserData(freshUserData);
                    setUser(freshUserData);
                    console.log('AuthContext - User data refreshed from server');
                }
            }
        } catch (error) {
            console.log('Could not refresh user data from server:', error.message);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);

            console.log('AuthContext - Login response:', response);

            // Create user data with proper ID
            const userData = {
                id: response.user_id, // This is the MongoDB ObjectId string
                name: response.name || email.split('@')[0],
                email: response.email || email,
                profile_picture: response.profile_picture || null,
            };

            console.log('AuthContext - Stored user data:', userData);

            // Store the user_id as the token (used for Bearer auth)
            if (response.token || response.user_id) {
                await storeToken(response.token || response.user_id);
            }

            await storeUserData(userData);
            setUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await authService.register(name, email, password);

            const userData = {
                id: response.user_id,
                name: response.name,
                email: response.email,
            };

            if (response.token) {
                await storeToken(response.token);
            }

            await storeUserData(userData);
            setUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        try {
            await removeToken();
            await removeUserData();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = async (userData) => {
        try {
            await storeUserData(userData);
            setUser(userData);
        } catch (error) {
            console.error('Update user error:', error);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
