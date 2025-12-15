import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { markTaskAsComplete, deleteTask } from '../services/taskService';

const TaskCard = ({ task, onPress, onTaskCompleted, onTaskDeleted, projectCreatorId }) => {
    const { user } = useAuth();
    const [completing, setCompleting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { title, assigned_to, due_date, status, description, _id } = task;

    const getStatusColor = () => {
        switch (status) {
            case 'Done':
                return theme.colors.success;
            case 'In Progress':
                return theme.colors.warning;
            default:
                return theme.colors.textSecondary;
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'Done':
                return 'checkmark-circle';
            case 'In Progress':
                return 'time';
            default:
                return 'ellipse-outline';
        }
    };

    const isOverdue = due_date && new Date(due_date) < new Date() && status !== 'Done';
    const isAssignedToCurrentUser = assigned_to && assigned_to.id === user?.id;
    const canMarkAsDone = isAssignedToCurrentUser && status !== 'Done';
    const isProjectCreator = projectCreatorId === user?.id;

    // Debug logging
    console.log('TaskCard Debug:', {
        taskTitle: title,
        assignedTo: assigned_to,
        currentUser: user?.id,
        isAssignedToCurrentUser,
        canMarkAsDone,
        status,
        projectCreatorId,
        isProjectCreator
    });

    const handleMarkAsDone = async () => {
        Alert.alert(
            'Mark as Done',
            `Are you sure you want to mark "${title}" as complete?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark as Done',
                    style: 'default',
                    onPress: async () => {
                        setCompleting(true);
                        const result = await markTaskAsComplete(_id);
                        setCompleting(false);

                        if (result.success) {
                            Alert.alert(
                                'Success!',
                                'Task marked as complete. The project creator has been notified.',
                                [{ text: 'OK', onPress: () => onTaskCompleted && onTaskCompleted() }]
                            );
                        } else {
                            Alert.alert('Error', result.error || 'Failed to mark task as complete');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteTask = async () => {
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        const result = await deleteTask(_id);
                        setDeleting(false);

                        if (result.success) {
                            Alert.alert(
                                'Deleted!',
                                'Task has been deleted successfully.',
                                [{ text: 'OK', onPress: () => onTaskDeleted && onTaskDeleted() }]
                            );
                        } else {
                            Alert.alert('Error', result.error || 'Failed to delete task');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
                <View style={styles.header}>
                    <Ionicons name={getStatusIcon()} size={20} color={getStatusColor()} />
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                </View>

                {description && (
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                )}

                <View style={styles.footer}>
                    {assigned_to && (
                        <View style={styles.assignee}>
                            <Ionicons name="person-outline" size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.assigneeText} numberOfLines={1}>
                                {assigned_to.name || 'Unassigned'}
                            </Text>
                        </View>
                    )}

                    {due_date && (
                        <View style={[styles.dueDate, isOverdue && styles.overdue]}>
                            <Ionicons
                                name="calendar-outline"
                                size={14}
                                color={isOverdue ? theme.colors.danger : theme.colors.textSecondary}
                            />
                            <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
                                {new Date(due_date).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {canMarkAsDone && (
                <TouchableOpacity
                    style={[styles.doneButton, completing && styles.doneButtonDisabled]}
                    onPress={handleMarkAsDone}
                    disabled={completing}
                    activeOpacity={0.7}
                >
                    {completing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            <Text style={styles.doneButtonText}>Mark as Done</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {isProjectCreator && (
                <TouchableOpacity
                    style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                    onPress={handleDeleteTask}
                    disabled={deleting}
                    activeOpacity={0.7}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="trash" size={18} color="#FFFFFF" />
                            <Text style={styles.deleteButtonText}>Delete Task</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: theme.spacing.md,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    assignee: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    assigneeText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    },
    dueDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dueDateText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    },
    overdue: {
        backgroundColor: theme.colors.danger + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
    },
    overdueText: {
        color: theme.colors.danger,
        fontWeight: '600',
    },
    doneButton: {
        backgroundColor: theme.colors.success,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    doneButtonDisabled: {
        backgroundColor: theme.colors.textSecondary,
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: theme.spacing.xs,
    },
    deleteButton: {
        backgroundColor: theme.colors.danger,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    deleteButtonDisabled: {
        backgroundColor: theme.colors.textSecondary,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: theme.spacing.xs,
    },
});

export default TaskCard;
