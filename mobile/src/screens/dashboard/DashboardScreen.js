import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import GradientHeader from '../../components/common/GradientHeader';
import GradientCard from '../../components/common/GradientCard';
import Avatar from '../../components/common/Avatar';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import api from '../../services/api';
import * as projectService from '../../services/projectService';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get('/api/dashboard/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardStats();
    };

    const completionRate =
        stats?.total_tasks > 0
            ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
            : 0;

    const QuickAction = ({ icon, label, onPress, color }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.quickLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const StatCard = ({ icon, value, label, color, percentage }) => (
        <View style={styles.statCard}>
            <View style={styles.statTop}>
                <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                {percentage !== undefined && (
                    <View style={styles.percentBadge}>
                        <Text style={styles.percentText}>{percentage}%</Text>
                    </View>
                )}
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* HEADER */}
            <LinearGradient
                colors={theme.colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.8}
                        >
                            <Avatar user={user} size="large" showBorder={true} />
                            <View style={styles.onlineIndicator} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <Ionicons name="notifications-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return 'Good Morning';
                                if (hour < 17) return 'Good Afternoon';
                                return 'Good Evening';
                            })()}
                        </Text>
                        <Text style={styles.userName}>
                            {user?.name || 'User'} 👋
                        </Text>
                        <Text style={styles.dateText}>
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* QUICK ACTIONS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.grid}>
                    <QuickAction
                        icon="add-circle"
                        label="New Project"
                        color={theme.colors.primary}
                        onPress={() =>
                            navigation.navigate('Projects', { screen: 'CreateProject' })
                        }
                    />
                    <QuickAction
                        icon="checkbox"
                        label="My Tasks"
                        color={theme.colors.success}
                        onPress={() =>
                            navigation.navigate('Projects', { screen: 'ProjectsList' })
                        }
                    />
                    <QuickAction
                        icon="chatbubbles"
                        label="Global Chat"
                        color="#3498db"
                        onPress={() => navigation.navigate('Chat')}
                    />
                    <QuickAction
                        icon="people"
                        label="Team"
                        color="#9b59b6"
                        onPress={() => navigation.navigate('Profile')}
                    />
                </View>
            </View>

            {/* STATS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.grid}>
                    <StatCard
                        icon="folder"
                        value={stats?.total_projects || 0}
                        label="Active Projects"
                        color={theme.colors.primary}
                    />
                    <StatCard
                        icon="checkmark-circle"
                        value={stats?.completed_tasks || 0}
                        label="Completed Tasks"
                        color={theme.colors.success}
                        percentage={completionRate}
                    />
                    <StatCard
                        icon="time"
                        value={stats?.in_progress_tasks || 0}
                        label="In Progress"
                        color={theme.colors.warning}
                    />
                    <StatCard
                        icon="people"
                        value={stats?.team_members_count || 0}
                        label="Team Members"
                        color="#3498db"
                    />
                </View>
            </View>

            {/* PROGRESS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Task Progress</Text>
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Overall Completion</Text>
                        <Text style={styles.progressPercent}>{completionRate}%</Text>
                    </View>

                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${completionRate}%` },
                            ]}
                        />
                    </View>

                    <View style={styles.progressMeta}>
                        <Text style={styles.metaText}>
                            {stats?.todo_tasks || 0} To-do
                        </Text>
                        <Text style={styles.metaText}>
                            {stats?.in_progress_tasks || 0} In Progress
                        </Text>
                        <Text style={styles.metaText}>
                            {stats?.completed_tasks || 0} Done
                        </Text>
                    </View>
                </View>
            </View>

            {/* RECENT PROJECTS */}
            {stats?.recent_projects?.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Projects</Text>
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate('Projects', {
                                    screen: 'ProjectsList',
                                })
                            }
                        >
                            <Text style={styles.seeAll}>See all →</Text>
                        </TouchableOpacity>
                    </View>

                    {stats.recent_projects.map(project => (
                        <TouchableOpacity
                            key={project._id}
                            style={styles.projectCard}
                            onPress={() =>
                                navigation.navigate('Projects', {
                                    screen: 'ProjectDetails',
                                    params: { projectId: project._id },
                                })
                            }
                        >
                            <View style={styles.projectTop}>
                                <Text style={styles.projectTitle} numberOfLines={1}>
                                    {project.title}
                                </Text>
                                <Text style={styles.projectPercent}>
                                    {Math.round(project.completion_percentage)}%
                                </Text>
                            </View>

                            <View style={styles.projectBarBg}>
                                <View
                                    style={[
                                        styles.projectBarFill,
                                        {
                                            width: `${project.completion_percentage}%`,
                                        },
                                    ]}
                                />
                            </View>

                            <Text style={styles.projectMeta}>
                                {project.completed_tasks} / {project.total_tasks} tasks completed
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={{ height: 30 }} />
        </ScrollView>
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
    },

    /* HEADER */
    header: {
        paddingTop: theme.spacing.xxl + 10,
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        width: '100%',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CD964',
        borderWidth: 2,
        borderColor: '#fff',
    },
    greetingContainer: {
        alignItems: 'flex-start',
    },
    greeting: {
        fontSize: 16,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginTop: 4,
    },
    dateText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 8,
    },
    notificationBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* SECTIONS */
    section: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    seeAll: {
        color: theme.colors.primary,
        fontWeight: '600',
    },

    /* GRID */
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },

    /* QUICK ACTION */
    quickAction: {
        width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
        backgroundColor: theme.colors.card,
        borderRadius: 22,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        elevation: 4,
    },
    quickIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    quickLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },

    /* STATS */
    statCard: {
        width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
        backgroundColor: theme.colors.card,
        borderRadius: 22,
        padding: theme.spacing.lg,
        elevation: 5,
    },
    statTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    statIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentBadge: {
        backgroundColor: theme.colors.success + '20',
        paddingHorizontal: 8,
        borderRadius: 12,
        justifyContent: 'center',
    },
    percentText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.success,
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },

    /* PROGRESS */
    progressCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 26,
        padding: theme.spacing.lg,
        elevation: 5,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#EAEAEA',
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    progressMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
    },
    metaText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },

    /* PROJECTS */
    projectCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 22,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        elevation: 4,
    },
    projectTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    projectPercent: {
        fontWeight: '700',
        color: theme.colors.primary,
    },
    projectBarBg: {
        height: 6,
        backgroundColor: '#EAEAEA',
        borderRadius: 6,
        marginBottom: 6,
    },
    projectBarFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
    },
    projectMeta: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
});

export default DashboardScreen;
