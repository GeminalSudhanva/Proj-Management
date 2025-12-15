import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import * as notificationService from '../../services/notificationService';

const NotificationItem = ({ notification, onPress }) => {
    const getIcon = () => {
        switch (notification.type) {
            case 'task_assigned':
                return 'checkbox-outline';
            case 'due_date_approaching':
                return 'time-outline';
            case 'user_mentioned':
                return 'at-outline';
            case 'chat_message':
                return 'chatbubble-outline';
            default:
                return 'notifications-outline';
        }
    };

    const getIconColor = () => {
        switch (notification.type) {
            case 'task_assigned':
                return theme.colors.primary;
            case 'due_date_approaching':
                return theme.colors.warning;
            case 'user_mentioned':
                return theme.colors.info;
            case 'chat_message':
                return theme.colors.success;
            default:
                return theme.colors.textSecondary;
        }
    };

    return (
        <TouchableOpacity style={styles.notificationItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
                <Ionicons name={getIcon()} size={24} color={getIconColor()} />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.message}>{notification.message}</Text>
                <Text style={styles.timestamp}>
                    {new Date(notification.timestamp).toLocaleString()}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
    );
};

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        const result = await notificationService.getNotifications();
        if (result.success) {
            setNotifications(result.data);
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = async (notification) => {
        // Mark as read
        await notificationService.markAsRead(notification._id);

        // Remove from list
        setNotifications(prev => prev.filter(n => n._id !== notification._id));

        // Navigate to link if available
        if (notification.link) {
            // Parse link and navigate accordingly
            // For now, just go back
            navigation.goBack();
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={() => handleNotificationPress(item)}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No notifications</Text>
                        <Text style={styles.emptySubtext}>You're all caught up!</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    contentContainer: {
        flex: 1,
    },
    message: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
});

export default NotificationsScreen;
