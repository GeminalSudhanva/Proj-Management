import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import api from '../../services/api';

const InvitationsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            // Fetch both invitations and notifications
            const [invitationsRes, notificationsRes] = await Promise.all([
                api.get('/api/invitations'),
                api.get('/api/notifications')
            ]);

            // Combine invitations and invitation-type notifications
            const allInvitations = [];

            // Add pending invitations
            if (invitationsRes.data && Array.isArray(invitationsRes.data)) {
                allInvitations.push(...invitationsRes.data.map(inv => ({
                    ...inv,
                    type: 'invitation'
                })));
            }

            // Add notification-based invitations
            if (notificationsRes.data && Array.isArray(notificationsRes.data)) {
                const inviteNotifications = notificationsRes.data
                    .filter(n => n.type === 'project_invitation')
                    .map(n => ({
                        _id: n._id,
                        project_id: n.project_id,
                        project_title: n.project_title,
                        invited_by_name: n.invited_by_name,
                        created_at: n.created_at,
                        type: 'notification'
                    }));
                allInvitations.push(...inviteNotifications);
            }

            setInvitations(allInvitations);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchInvitations();
    };

    const handleAccept = async (invitation) => {
        try {
            if (invitation.type === 'invitation') {
                // Accept via invitation endpoint
                const response = await api.post(
                    `/api/invitation/${invitation._id}/respond`,
                    { action: 'accept' },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data.success) {
                    Alert.alert('Success', 'Invitation accepted! You can now access the project.', [
                        {
                            text: 'View Project',
                            onPress: () => {
                                navigation.navigate('Projects', {
                                    screen: 'ProjectDetails',
                                    params: { projectId: invitation.project_id }
                                });
                            }
                        },
                        {
                            text: 'OK',
                            onPress: () => fetchInvitations()
                        }
                    ]);
                } else {
                    Alert.alert('Error', response.data.error || 'Failed to accept invitation');
                }
            } else {
                // For notification-based invitations, just navigate to project
                navigation.navigate('Projects', {
                    screen: 'ProjectDetails',
                    params: { projectId: invitation.project_id }
                });
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            Alert.alert('Error', 'Failed to accept invitation');
        }
    };

    const handleDecline = async (invitation) => {
        try {
            if (invitation.type === 'invitation') {
                await api.post(
                    `/api/invitation/${invitation._id}/respond`,
                    { action: 'decline' },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }

            Alert.alert('Success', 'Invitation declined');
            fetchInvitations(); // Refresh list
        } catch (error) {
            console.error('Error declining invitation:', error);
            Alert.alert('Error', 'Failed to decline invitation');
        }
    };

    const renderInvitation = ({ item }) => (
        <View style={styles.invitationCard}>
            <View style={styles.invitationHeader}>
                <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
                <View style={styles.invitationInfo}>
                    <Text style={styles.projectTitle}>{item.project_title}</Text>
                    <Text style={styles.invitedBy}>
                        Invited by {item.invited_by_name || 'Unknown'}
                    </Text>
                    <Text style={styles.date}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            <View style={styles.actions}>
                <Button
                    title="Accept"
                    onPress={() => handleAccept(item)}
                    style={styles.acceptButton}
                />
                {item.type === 'invitation' && (
                    <Button
                        title="Decline"
                        onPress={() => handleDecline(item)}
                        variant="outline"
                        style={styles.declineButton}
                    />
                )}
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
            <FlatList
                data={invitations}
                keyExtractor={(item) => item._id}
                renderItem={renderInvitation}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="mail-open-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No invitations</Text>
                        <Text style={styles.emptySubtext}>You don't have any pending invitations</Text>
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
    invitationCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    invitationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    invitationInfo: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    invitedBy: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 2,
    },
    date: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    acceptButton: {
        flex: 1,
    },
    declineButton: {
        flex: 1,
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
        textAlign: 'center',
    },
});

export default InvitationsScreen;
