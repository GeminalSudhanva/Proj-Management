import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

// Store auth token
export const storeToken = async (token) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
        console.error('Error storing token:', error);
    }
};

// Get auth token
export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

// Remove auth token
export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

// Store user data
export const storeUserData = async (userData) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
        console.error('Error storing user data:', error);
    }
};

// Get user data
export const getUserData = async () => {
    try {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
};

// Remove user data
export const removeUserData = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
        console.error('Error removing user data:', error);
    }
};

// Clear all storage
export const clearStorage = async () => {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Error clearing storage:', error);
    }
};

export default {
    storeToken,
    getToken,
    removeToken,
    storeUserData,
    getUserData,
    removeUserData,
    clearStorage,
};
