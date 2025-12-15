import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const ProjectCard = ({ project, onPress }) => {
    const { title, course, deadline, description } = project;

    // Calculate progress (placeholder - will be calculated from tasks)
    const progress = project.completion_percentage || 0;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Ionicons name="folder" size={24} color={theme.colors.primary} />
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>

            {description && (
                <Text style={styles.description} numberOfLines={2}>{description}</Text>
            )}

            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Ionicons name="book-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.infoText}>{course || 'No course'}</Text>
                </View>
                {deadline && (
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.infoText}>{new Date(deadline).toLocaleDateString()}</Text>
                    </View>
                )}
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    infoText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        marginRight: theme.spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
        borderRadius: theme.borderRadius.full,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
        minWidth: 35,
        textAlign: 'right',
    },
});

export default ProjectCard;
