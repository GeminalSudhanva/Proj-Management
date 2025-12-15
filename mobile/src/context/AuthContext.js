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
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);

            console.log('Login response:', response);

            // Note: Adjust based on your actual API response structure
            // The Flask app uses session-based auth, so we might need to adapt this
            const userData = {
                id: response.user_id || response.id || 'user',
                name: response.name || email.split('@')[0],
                email: response.email || email,
            };

            console.log('Stored user data:', userData);

            // Store token if provided, otherwise use session cookie
            if (response.token) {
                await storeToken(response.token);
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
