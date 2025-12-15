import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const NotificationsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            console.log('Fetching notifications...');
            const response = await api.get('/api/notifications');
            console.log('Notifications response:', response);
            console.log('Notifications data:', response.data);

            if (response.data && Array.isArray(response.data)) {
                console.log('Setting notifications:', response.data.length, 'items');
                setNotifications(response.data);
            } else {
                console.log('Invalid response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            console.error('Error response:', error.response);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleNotificationPress = async (notification) => {
        try {
            // Mark as read
            if (!notification.read) {
                await api.post(`/api/notifications/mark_read/${notification._id}`);
                fetchNotifications(); // Refresh list
            }

            // Navigate based on notification type
            if (notification.type === 'project_invitation') {
                navigation.navigate('Profile', { screen: 'Invitations' });
            } else if (notification.type === 'task_assigned' || notification.type === 'task_completed') {
                navigation.navigate('Projects', {
                    screen: 'ProjectDetails',
                    params: { projectId: notification.project_id }
                });
            }
        } catch (error) {
            console.error('Error handling notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'project_invitation':
                return 'mail';
            case 'task_assigned':
                return 'checkbox';
            case 'task_completed':
                return 'checkmark-circle';
            default:
                return 'notifications';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'project_invitation':
                return theme.colors.primary;
            case 'task_assigned':
                return theme.colors.warning;
            case 'task_completed':
                return theme.colors.success;
            default:
                return theme.colors.textSecondary;
        }
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                !item.read && styles.unreadCard
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(item.type) + '20' }
            ]}>
                <Ionicons
                    name={getNotificationIcon(item.type)}
                    size={24}
                    color={getNotificationColor(item.type)}
                />
            </View>
            <View style={styles.notificationContent}>
                <Text style={[
                    styles.notificationText,
                    !item.read && styles.unreadText
                ]}>
                    {item.message}
                </Text>
                <Text style={styles.notificationTime}>
                    {new Date(item.created_at).toLocaleDateString()} at{' '}
                    {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

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
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="notifications-off-outline"
                            size={64}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={styles.emptyText}>No notifications</Text>
                        <Text style={styles.emptySubtext}>
                            You're all caught up!
                        </Text>
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
    listContent: {
        padding: theme.spacing.md,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: '600',
    },
    notificationTime: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing.sm,
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
