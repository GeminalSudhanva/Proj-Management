// Firebase Authentication Service
// Using Firebase v9 compat mode for Expo Go

import { auth } from '../config/firebaseConfig';

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const token = await userCredential.user.getIdToken();
        return {
            user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                emailVerified: userCredential.user.emailVerified,
            },
            token
        };
    } catch (error) {
        throw handleAuthError(error);
    }
};

/**
 * Create a new user account
 */
export const signUp = async (email, password, displayName) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);

        await userCredential.user.updateProfile({ displayName });

        try {
            await userCredential.user.sendEmailVerification();
        } catch (e) {
            console.warn('Could not send verification email:', e);
        }

        const token = await userCredential.user.getIdToken();
        return {
            user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: displayName,
                emailVerified: false,
            },
            token
        };
    } catch (error) {
        throw handleAuthError(error);
    }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
    try {
        await auth.signOut();
    } catch (error) {
        throw handleAuthError(error);
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        await auth.sendPasswordResetEmail(email);
    } catch (error) {
        throw handleAuthError(error);
    }
};

/**
 * Get the current user's ID token
 */
export const getIdToken = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
};

/**
 * Get the current Firebase user
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged((user) => {
        if (user) {
            callback({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified,
            });
        } else {
            callback(null);
        }
    });
};

/**
 * Handle Firebase Auth errors
 */
const handleAuthError = (error) => {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred.';
    const customError = new Error(message);
    customError.code = error.code;
    return customError;
};

export default {
    signIn,
    signUp,
    signOut,
    resetPassword,
    getIdToken,
    getCurrentUser,
    onAuthStateChanged,
};
