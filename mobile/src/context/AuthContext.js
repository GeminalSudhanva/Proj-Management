import React, { createContext, useState, useContext, useEffect } from 'react';
import { storeUserData, getUserData, removeUserData } from '../utils/storage';
import * as firebaseAuth from '../services/firebaseAuthService';
import * as analyticsService from '../services/analyticsService';
import * as notificationService from '../services/notificationService';

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

    // Helper to sync user with backend with retry mechanism for cold starts
    const syncWithBackend = async (firebaseUser, retryCount = 0) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

        try {
            const api = require('../services/api').default;
            const { API_ENDPOINTS } = require('../constants/config');

            const response = await api.post(API_ENDPOINTS.FIREBASE_SYNC, {
                firebase_uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            });

            console.log('Auth state sync - MongoDB user_id:', response.data.user_id);
            return response.data.user_id;
        } catch (error) {
            // Retry on network errors (cold start scenarios)
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAYS[retryCount] || 4000;
                console.log(`Sync failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

                await new Promise(resolve => setTimeout(resolve, delay));
                return syncWithBackend(firebaseUser, retryCount + 1);
            }

            console.warn('Auth state sync failed after retries:', error.message);
            return null;
        }
    };

    // Listen for Firebase auth state changes
    useEffect(() => {
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // Sync with backend to get MongoDB user ID
                const mongoUserId = await syncWithBackend(firebaseUser);

                // User is signed in
                const userData = {
                    id: mongoUserId || firebaseUser.uid, // Prefer MongoDB ID
                    firebaseUid: firebaseUser.uid, // Keep Firebase UID for auth operations
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                };

                console.log('Auth state - user.id:', userData.id, 'firebaseUid:', userData.firebaseUid);

                await storeUserData(userData);
                setUser(userData);
                setIsAuthenticated(true);

                // Set analytics user ID
                await analyticsService.setAnalyticsUserId(firebaseUser.uid);

                // Register for push notifications
                const pushToken = await notificationService.registerForPushNotificationsAsync();
                if (pushToken && mongoUserId) {
                    await notificationService.savePushTokenToBackend(mongoUserId, pushToken);
                }
            } else {
                // User is signed out
                await removeUserData();
                setUser(null);
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    // Sync Firebase user to MongoDB backend and get MongoDB user ID
    const syncUserToBackend = async (firebaseUser) => {
        try {
            const api = require('../services/api').default;
            const { API_ENDPOINTS } = require('../constants/config');

            const response = await api.post(API_ENDPOINTS.FIREBASE_SYNC, {
                firebase_uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            });

            console.log('User synced to backend:', response.data);
            // Return the MongoDB user_id for use in permission checks
            return response.data.user_id;
        } catch (error) {
            console.warn('Failed to sync user to backend:', error);
            // Don't fail login/register if sync fails - user can still use app
            return null;
        }
    };

    const login = async (email, password) => {
        try {
            const result = await firebaseAuth.signIn(email, password);

            // Sync user to MongoDB backend and get MongoDB ID
            const mongoUserId = await syncUserToBackend(result.user);

            const userData = {
                id: mongoUserId || result.user.uid, // Prefer MongoDB ID for permission checks
                firebaseUid: result.user.uid, // Keep Firebase UID for auth operations
                name: result.user.displayName || email.split('@')[0],
                email: result.user.email,
                emailVerified: result.user.emailVerified,
            };

            await storeUserData(userData);
            setUser(userData);
            setIsAuthenticated(true);

            // Log analytics event
            await analyticsService.logLogin();

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const result = await firebaseAuth.signUp(email, password, name);

            // Sync user to MongoDB backend and get MongoDB ID
            const mongoUserId = await syncUserToBackend({ ...result.user, displayName: name });

            const userData = {
                id: mongoUserId || result.user.uid, // Prefer MongoDB ID for permission checks
                firebaseUid: result.user.uid, // Keep Firebase UID for auth operations
                name: name,
                email: result.user.email,
                emailVerified: result.user.emailVerified,
            };

            await storeUserData(userData);
            setUser(userData);
            setIsAuthenticated(true);

            // Log analytics event
            await analyticsService.logSignUp();

            return { success: true, message: 'Account created! Please verify your email.' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        try {
            // Remove push token before logging out
            if (user?.id) {
                await notificationService.removePushToken(user.id);
            }
            await firebaseAuth.signOut();
            await removeUserData();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const forgotPassword = async (email) => {
        try {
            await firebaseAuth.resetPassword(email);
            return { success: true, message: 'Password reset email sent!' };
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, error: error.message || 'Failed to send reset email' };
        }
    };

    // Sign in with Google - called after Google auth flow returns idToken
    const signInWithGoogle = async (idToken) => {
        try {
            const googleAuth = require('../services/googleAuthService');
            const result = await googleAuth.signInWithGoogleCredential(idToken);

            // Sync user to MongoDB backend and get MongoDB ID
            const mongoUserId = await syncUserToBackend(result.user);

            const userData = {
                id: mongoUserId || result.user.uid,
                firebaseUid: result.user.uid,
                name: result.user.displayName || result.user.email.split('@')[0],
                email: result.user.email,
                emailVerified: true, // Google accounts are always verified
                photoURL: result.user.photoURL,
            };

            await storeUserData(userData);
            setUser(userData);
            setIsAuthenticated(true);

            // Log analytics event
            await analyticsService.logLogin();

            return { success: true };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return { success: false, error: error.message || 'Google sign-in failed' };
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

    // Get Firebase ID token for API requests
    const getAuthToken = async () => {
        return await firebaseAuth.getIdToken();
    };

    // Delete user account from backend and Firebase
    const deleteAccount = async () => {
        try {
            // Import api here to avoid circular dependency
            const api = require('../services/api').default;
            const { API_ENDPOINTS } = require('../constants/config');

            // Get Firebase UID (from user context or current Firebase user)
            const firebaseUser = firebaseAuth.getCurrentUser();
            const firebase_uid = user?.firebaseUid || firebaseUser?.uid || user?.id;

            // 1. Call backend to delete all user data (POST with firebase_uid)
            const response = await api.post(API_ENDPOINTS.DELETE_ACCOUNT, { firebase_uid });

            if (response.data.success) {
                // 2. Delete Firebase account
                try {
                    await firebaseAuth.deleteAccount();
                } catch (firebaseError) {
                    console.warn('Firebase account deletion failed:', firebaseError);
                    // Continue anyway since backend data is deleted
                }

                // 3. Clear local storage
                await removeUserData();
                setUser(null);
                setIsAuthenticated(false);

                return { success: true, message: 'Account deleted successfully' };
            } else {
                return { success: false, error: response.data.error || 'Failed to delete account' };
            }
        } catch (error) {
            console.error('Delete account error:', error);
            return { success: false, error: error.message || error.error || 'Failed to delete account' };
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        forgotPassword,
        signInWithGoogle,
        updateUser,
        getAuthToken,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
