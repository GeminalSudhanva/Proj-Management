// Google Authentication Service for ProjFlow
// Uses expo-auth-session with Firebase

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { firebase, auth } from '../config/firebaseConfig';

// Complete the auth session for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// Google Web Client ID from Firebase Console
const GOOGLE_WEB_CLIENT_ID = '935100277148-bm3kslfsenduk0jep6ndeon1cokvm274.apps.googleusercontent.com';

/**
 * Hook to use Google Sign-In
 * Must be called inside a React component
 */
export const useGoogleAuth = () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        // For Android, we use the web client ID
        androidClientId: GOOGLE_WEB_CLIENT_ID,
    });

    return { request, response, promptAsync };
};

/**
 * Sign in with Google ID token
 * @param {string} idToken - Google ID token from auth response
 * @returns {Promise<{user: object, token: string}>}
 */
export const signInWithGoogleCredential = async (idToken) => {
    try {
        // Create Firebase credential with Google ID token
        const credential = firebase.auth.GoogleAuthProvider.credential(idToken);

        // Sign in to Firebase with the credential
        const userCredential = await auth.signInWithCredential(credential);

        // Get Firebase ID token for backend
        const token = await userCredential.user.getIdToken();

        return {
            user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName,
                photoURL: userCredential.user.photoURL,
                emailVerified: true, // Google accounts are verified
            },
            token
        };
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw handleGoogleError(error);
    }
};

/**
 * Handle Google auth errors
 */
const handleGoogleError = (error) => {
    const errorMessages = {
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
        'auth/credential-already-in-use': 'This credential is already associated with another account.',
        'auth/invalid-credential': 'Invalid Google credential. Please try again.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact support.',
        'auth/user-disabled': 'This account has been disabled.',
    };

    const message = errorMessages[error.code] || error.message || 'Google sign-in failed. Please try again.';
    const customError = new Error(message);
    customError.code = error.code;
    return customError;
};

export default {
    useGoogleAuth,
    signInWithGoogleCredential,
};
