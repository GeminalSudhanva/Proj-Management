import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

// Base Skeleton component with shimmer animation
const SkeletonBox = ({ width: boxWidth, height, borderRadius = 8, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmer = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        );
        shimmer.start();
        return () => shimmer.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View
            style={[
                styles.skeletonBox,
                {
                    width: boxWidth,
                    height,
                    borderRadius,
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                />
            </Animated.View>
        </View>
    );
};

// Skeleton for Project Cards
export const ProjectCardSkeleton = () => (
    <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
            <SkeletonBox width={180} height={20} borderRadius={4} />
            <SkeletonBox width={50} height={24} borderRadius={12} />
        </View>
        <SkeletonBox width="100%" height={6} borderRadius={3} style={{ marginTop: 12 }} />
        <View style={styles.projectFooter}>
            <SkeletonBox width={100} height={14} borderRadius={4} />
            <SkeletonBox width={80} height={14} borderRadius={4} />
        </View>
    </View>
);

// Skeleton for Stat Cards (used in Dashboard)
export const StatCardSkeleton = () => (
    <View style={styles.statCard}>
        <View style={styles.statTop}>
            <SkeletonBox width={42} height={42} borderRadius={21} />
            <SkeletonBox width={40} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width={60} height={32} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBox width={100} height={14} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
);

// Skeleton for Quick Action buttons
export const QuickActionSkeleton = () => (
    <View style={styles.quickAction}>
        <SkeletonBox width={52} height={52} borderRadius={26} />
        <SkeletonBox width={70} height={14} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
);

// Skeleton for Progress Card
export const ProgressCardSkeleton = () => (
    <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
            <SkeletonBox width={120} height={18} borderRadius={4} />
            <SkeletonBox width={50} height={22} borderRadius={4} />
        </View>
        <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginTop: 16 }} />
        <View style={styles.progressMeta}>
            <SkeletonBox width={60} height={12} borderRadius={4} />
            <SkeletonBox width={80} height={12} borderRadius={4} />
            <SkeletonBox width={50} height={12} borderRadius={4} />
        </View>
    </View>
);

// Skeleton for Task Cards
export const TaskCardSkeleton = () => (
    <View style={styles.taskCard}>
        <View style={styles.taskHeader}>
            <SkeletonBox width={24} height={24} borderRadius={12} />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonBox width="80%" height={16} borderRadius={4} />
                <SkeletonBox width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
        </View>
        <View style={styles.taskFooter}>
            <SkeletonBox width={80} height={24} borderRadius={12} />
            <SkeletonBox width={100} height={14} borderRadius={4} />
        </View>
    </View>
);

// Skeleton for Dashboard Header
export const DashboardHeaderSkeleton = () => (
    <LinearGradient
        colors={theme.colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
    >
        <View style={styles.headerLeft}>
            <SkeletonBox width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
            <View>
                <SkeletonBox width={200} height={24} borderRadius={4} />
                <SkeletonBox width={160} height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
        </View>
    </LinearGradient>
);

// Full Dashboard Skeleton
export const DashboardSkeleton = () => (
    <View style={styles.container}>
        <DashboardHeaderSkeleton />

        {/* Quick Actions Section */}
        <View style={styles.section}>
            <SkeletonBox width={120} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.grid}>
                <QuickActionSkeleton />
                <QuickActionSkeleton />
                <QuickActionSkeleton />
                <QuickActionSkeleton />
            </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
            <SkeletonBox width={100} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.grid}>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </View>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
            <SkeletonBox width={120} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
            <ProgressCardSkeleton />
        </View>

        {/* Recent Projects Section */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <SkeletonBox width={130} height={20} borderRadius={4} />
                <SkeletonBox width={60} height={16} borderRadius={4} />
            </View>
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
        </View>
    </View>
);

// Projects List Skeleton
export const ProjectsListSkeleton = () => (
    <View style={styles.listContainer}>
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
    </View>
);

// Task List Skeleton
export const TaskListSkeleton = () => (
    <View style={styles.listContainer}>
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
    </View>
);

// Project Details Skeleton
export const ProjectDetailsSkeleton = () => (
    <View style={styles.container}>
        {/* Header */}
        <LinearGradient
            colors={theme.colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.detailsHeader}
        >
            <SkeletonBox width={200} height={28} borderRadius={4} />
            <SkeletonBox width="100%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonBox width="70%" height={14} borderRadius={4} style={{ marginTop: 4 }} />

            {/* Progress */}
            <View style={styles.detailsProgress}>
                <SkeletonBox width="100%" height={8} borderRadius={4} />
                <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
            </View>
        </LinearGradient>

        {/* Team Members */}
        <View style={styles.section}>
            <SkeletonBox width={130} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={styles.avatarRow}>
                <SkeletonBox width={40} height={40} borderRadius={20} />
                <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginLeft: -10 }} />
                <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginLeft: -10 }} />
            </View>
        </View>

        {/* Tasks */}
        <View style={styles.section}>
            <SkeletonBox width={80} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContainer: {
        padding: theme.spacing.md,
    },
    skeletonBox: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
    },
    shimmer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    shimmerGradient: {
        width: '100%',
        height: '100%',
    },
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },

    // Header
    header: {
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    // Project Card
    projectCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        elevation: 3,
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    projectFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },

    // Stat Card
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
    },

    // Quick Action
    quickAction: {
        width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
        backgroundColor: theme.colors.card,
        borderRadius: 22,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        elevation: 4,
    },

    // Progress Card
    progressCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 26,
        padding: theme.spacing.lg,
        elevation: 5,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.md,
    },

    // Task Card
    taskCard: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        elevation: 3,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },

    // Details Header
    detailsHeader: {
        paddingTop: theme.spacing.xxl,
        paddingBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    detailsProgress: {
        marginTop: theme.spacing.lg,
    },
    avatarRow: {
        flexDirection: 'row',
    },
});

export default {
    ProjectCardSkeleton,
    StatCardSkeleton,
    QuickActionSkeleton,
    ProgressCardSkeleton,
    TaskCardSkeleton,
    DashboardHeaderSkeleton,
    DashboardSkeleton,
    ProjectsListSkeleton,
    TaskListSkeleton,
    ProjectDetailsSkeleton,
};
