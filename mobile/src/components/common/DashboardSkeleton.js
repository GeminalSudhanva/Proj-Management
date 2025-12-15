import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SkeletonBox = ({ style }) => {
    const opacity = useSharedValue(0.4);

    opacity.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.skeleton, animatedStyle, style]} />;
};

const DashboardSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <SkeletonBox style={styles.header} />

            {/* Stats */}
            <View style={styles.row}>
                <SkeletonBox style={styles.card} />
                <SkeletonBox style={styles.card} />
            </View>

            <View style={styles.row}>
                <SkeletonBox style={styles.card} />
                <SkeletonBox style={styles.card} />
            </View>

            {/* Progress */}
            <SkeletonBox style={styles.progress} />

            {/* Projects */}
            <SkeletonBox style={styles.project} />
            <SkeletonBox style={styles.project} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    skeleton: {
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
        marginBottom: 16,
    },
    header: {
        height: 120,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 48) / 2,
        height: 120,
    },
    progress: {
        height: 140,
    },
    project: {
        height: 90,
    },
});

export default DashboardSkeleton;
