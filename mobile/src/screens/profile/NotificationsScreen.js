import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import * as mentorService from '../../services/mentorService';

const NotificationsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' or 'mentorRequests'
    const [notifications, setNotifications] = useState([]);
    const [mentorRequests, setMentorRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch notifications
            const notifResponse = await api.get('/api/notifications');
            if (notifResponse.data && Array.isArray(notifResponse.data)) {
                // Filter out mentor_request notifications (they're shown in Mentor Requests tab)
                const filteredNotifications = notifResponse.data.filter(
                    n => n.type !== 'mentor_request'
                );
                setNotifications(filteredNotifications);
            }

            // Fetch mentor requests
            const mentorResponse = await mentorService.getMentorRequests();
            if (mentorResponse.success && mentorResponse.mentor_requests) {
                setMentorRequests(mentorResponse.mentor_requests);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleNotificationPress = async (notification) => {
        try {
            if (!notification.read) {
                await api.post(`/api/notifications/mark_read/${notification._id}`);
                fetchData();
            }

            if (notification.type === 'project_invitation') {
                navigation.navigate('Profile', { screen: 'Invitations' });
            } else if (notification.type === 'task_assigned' || notification.type === 'task_completed' || notification.type === 'mentor_accepted') {
                navigation.navigate('Projects', {
                    screen: 'ProjectDetails',
                    params: { projectId: notification.project_id }
                });
            }
        } catch (error) {
            console.error('Error handling notification:', error);
        }
    };

    const handleMentorRequestAction = async (requestId, action) => {
        const actionText = action === 'accept' ? 'Accept' : 'Decline';
        Alert.alert(
            `${actionText} Mentor Request`,
            `Are you sure you want to ${action} this mentor request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: actionText,
                    style: action === 'decline' ? 'destructive' : 'default',
                    onPress: async () => {
                        const result = await mentorService.respondToMentorRequest(requestId, action);
                        if (result.success) {
                            Alert.alert('Success', result.message);
                            fetchData();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to process request');
                        }
                    }
                }
            ]
        );
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'project_invitation':
                return 'mail';
            case 'task_assigned':
                return 'checkbox';
            case 'task_completed':
                return 'checkmark-circle';
            case 'mentor_accepted':
                return 'school';
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
            case 'mentor_accepted':
                return theme.colors.secondary;
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

    const renderMentorRequest = ({ item }) => (
        <View style={styles.mentorRequestCard}>
            <View style={styles.mentorRequestHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.secondary + '20' }]}>
                    <Ionicons name="school" size={24} color={theme.colors.secondary} />
                </View>
                <View style={styles.mentorRequestContent}>
                    <Text style={styles.mentorRequestTitle}>Mentor Request</Text>
                    <Text style={styles.mentorRequestProject}>{item.project_title}</Text>
                    <Text style={styles.mentorRequestFrom}>From: {item.invited_by_name}</Text>
                    <Text style={styles.notificationTime}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <View style={styles.mentorRequestActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleMentorRequestAction(item._id, 'accept')}
                >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleMentorRequestAction(item._id, 'decline')}
                >
                    <Ionicons name="close" size={18} color={theme.colors.danger} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
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
            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
                    onPress={() => setActiveTab('notifications')}
                >
                    <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
                        Notifications
                    </Text>
                    {notifications.filter(n => !n.read).length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{notifications.filter(n => !n.read).length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'mentorRequests' && styles.activeTab]}
                    onPress={() => setActiveTab('mentorRequests')}
                >
                    <Text style={[styles.tabText, activeTab === 'mentorRequests' && styles.activeTabText]}>
                        Mentor Requests
                    </Text>
                    {mentorRequests.length > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]}>
                            <Text style={styles.badgeText}>{mentorRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'notifications' ? (
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
                            <Text style={styles.emptySubtext}>You're all caught up!</Text>
                        </View>
                    }
                />
            ) : (
                <FlatList
                    data={mentorRequests}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMentorRequest}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name="school-outline"
                                size={64}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.emptyText}>No mentor requests</Text>
                            <Text style={styles.emptySubtext}>
                                You'll see mentor invitations here
                            </Text>
                        </View>
                    }
                />
            )}
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
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: theme.spacing.xs,
        paddingHorizontal: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
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
    mentorRequestCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.secondary,
    },
    mentorRequestHeader: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    mentorRequestContent: {
        flex: 1,
    },
    mentorRequestTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    mentorRequestProject: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    mentorRequestFrom: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    mentorRequestActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        gap: 4,
    },
    acceptButton: {
        backgroundColor: theme.colors.success,
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    declineButton: {
        backgroundColor: theme.colors.danger + '20',
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    declineButtonText: {
        color: theme.colors.danger,
        fontWeight: '600',
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
