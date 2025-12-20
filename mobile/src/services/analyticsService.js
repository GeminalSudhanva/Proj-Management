// Firebase Analytics Service
// Note: Analytics has limited support in Expo Go, works fully in development builds

import { logEvent as firebaseLogEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../config/firebaseConfig';

/**
 * Log a custom event to Firebase Analytics
 * @param {string} eventName - Name of the event
 * @param {object} params - Event parameters
 */
export const logEvent = async (eventName, params = {}) => {
    try {
        if (analytics) {
            await firebaseLogEvent(analytics, eventName, params);
        } else {
            // Analytics not available in Expo Go, log to console for debugging
            console.log(`[Analytics] ${eventName}:`, params);
        }
    } catch (error) {
        console.warn('Analytics error:', error);
    }
};

/**
 * Set the user ID for analytics
 * @param {string} userId 
 */
export const setAnalyticsUserId = async (userId) => {
    try {
        if (analytics) {
            await setUserId(analytics, userId);
        }
    } catch (error) {
        console.warn('Analytics setUserId error:', error);
    }
};

/**
 * Set user properties for segmentation
 * @param {object} properties 
 */
export const setAnalyticsUserProperties = async (properties) => {
    try {
        if (analytics) {
            await setUserProperties(analytics, properties);
        }
    } catch (error) {
        console.warn('Analytics setUserProperties error:', error);
    }
};

/**
 * Log screen view event
 * @param {string} screenName 
 * @param {string} screenClass 
 */
export const logScreenView = async (screenName, screenClass = '') => {
    await logEvent('screen_view', {
        screen_name: screenName,
        screen_class: screenClass || screenName,
    });
};

// Predefined event helpers
export const logLogin = async (method = 'email') => {
    await logEvent('login', { method });
};

export const logSignUp = async (method = 'email') => {
    await logEvent('sign_up', { method });
};

export const logProjectCreated = async (projectId) => {
    await logEvent('project_created', { project_id: projectId });
};

export const logTaskCreated = async (projectId, taskId) => {
    await logEvent('task_created', { project_id: projectId, task_id: taskId });
};

export const logTaskCompleted = async (projectId, taskId) => {
    await logEvent('task_completed', { project_id: projectId, task_id: taskId });
};

export default {
    logEvent,
    setAnalyticsUserId,
    setAnalyticsUserProperties,
    logScreenView,
    logLogin,
    logSignUp,
    logProjectCreated,
    logTaskCreated,
    logTaskCompleted,
};
