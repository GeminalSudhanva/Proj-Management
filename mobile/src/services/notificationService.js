import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications and get Expo push token
 * @returns {Promise<string|null>} Expo push token or null if failed
 */
export async function registerForPushNotificationsAsync() {
    let token = null;

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
    }

    try {
        // Get the Expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

        if (!projectId) {
            console.log('No project ID found for push notifications');
            // Try to get token anyway (might work in development)
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        }

        console.log('Expo Push Token:', token);
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4F46E5',
        });

        // Team chat notifications channel
        await Notifications.setNotificationChannelAsync('team-chat', {
            name: 'Team Chat',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 100, 100, 100],
        });

        // Task notifications channel
        await Notifications.setNotificationChannelAsync('tasks', {
            name: 'Tasks',
            importance: Notifications.AndroidImportance.HIGH,
        });
    }

    return token;
}

/**
 * Save push token to backend
 * @param {string} userId - User's MongoDB ID
 * @param {string} token - Expo push token
 */
export async function savePushTokenToBackend(userId, token) {
    try {
        await api.post('/api/push-token', {
            userId,
            token,
            platform: Platform.OS,
        });
        console.log('Push token saved to backend');
    } catch (error) {
        console.error('Failed to save push token:', error);
    }
}

/**
 * Remove push token from backend (on logout)
 * @param {string} userId - User's MongoDB ID
 */
export async function removePushToken(userId) {
    try {
        await api.delete('/api/push-token', {
            data: { userId }
        });
        console.log('Push token removed from backend');
    } catch (error) {
        console.error('Failed to remove push token:', error);
    }
}

/**
 * Add listener for when notification is received while app is in foreground
 * @param {function} callback - Function to call with notification data
 * @returns {Subscription} - Call .remove() to unsubscribe
 */
export function addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when user taps on notification
 * @param {function} callback - Function to call with notification response
 * @returns {Subscription} - Call .remove() to unsubscribe
 */
export function addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the notification that was used to open the app (if any)
 * @returns {Promise<NotificationResponse|null>}
 */
export async function getLastNotificationResponse() {
    return await Notifications.getLastNotificationResponseAsync();
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
        },
        trigger: { seconds: 1 },
    });
}

export default {
    registerForPushNotificationsAsync,
    savePushTokenToBackend,
    removePushToken,
    addNotificationReceivedListener,
    addNotificationResponseListener,
    getLastNotificationResponse,
    scheduleLocalNotification,
};
