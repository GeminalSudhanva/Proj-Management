import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const getNotifications = async () => {
    try {
        const response = await api.get(API_ENDPOINTS.NOTIFICATIONS);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch notifications' };
    }
};

export const markAsRead = async (notificationId) => {
    try {
        const response = await api.post(API_ENDPOINTS.MARK_NOTIFICATION_READ(notificationId));
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to mark notification as read' };
    }
};

export default {
    getNotifications,
    markAsRead,
};
