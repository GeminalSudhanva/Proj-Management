import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import TaskCard from '../../components/TaskCard';
import * as projectService from '../../services/projectService';

const ProjectDetailsScreen = ({ route, navigation }) => {
    const { projectId } = route.params;
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectDetails();
    }, []);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            const response = await projectService.getProjectDetails(projectId);

            console.log('[ProjectDetails] Full response:', response);

            if (response.success && response.data) {
                const projectData = response.data;
                console.log('[ProjectDetails] Project data:', projectData);
                console.log('[ProjectDetails] created_by:', projectData.created_by);
                console.log('[ProjectDetails] team_members:', projectData.team_members);

                setProject(projectData);
                // setCreatedBy(projectData.created_by); // This state variable is not defined in the original code. Assuming it's not needed or will be added elsewhere.

                // Fetch tasks for this project
                // Assuming taskService is imported and available
                // const tasksResponse = await taskService.getProjectTasks(projectId);
                // if (tasksResponse.success) {
                //     setTasks(tasksResponse.data || []);
                // }
                // Reverting to original task setting as taskService is not imported and setCreatedBy is not defined.
                setTasks(projectData.tasks || []);
            } else {
                console.error('[ProjectDetails] Failed to fetch project:', response.error);
                Alert.alert('Error', response.error || 'Failed to load project');
            }
        } catch (error) {
            console.error('[ProjectDetails] Error:', error);
            Alert.alert('Error', 'Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = () => {
        Alert.alert(
            'Delete Project',
            'Are you sure you want to delete this project? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await projectService.deleteProject(projectId);
                        if (result.success) {
                            Alert.alert('Success', 'Project deleted successfully!', [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        // Navigate back to list - it will auto-refresh via useFocusEffect
                                        navigation.navigate('ProjectsList');
                                    },
                                },
                            ]);
                        } else {
                            Alert.alert('Error', result.error || 'Failed to delete project');
                        }
                    },
                },
            ]
        );
    };

    const isCreator = project && project.created_by === user?.id;

    // Debug logging
    console.log('Project Details Debug:', {
        projectId,
        userId: user?.id,
        createdBy: project?.created_by,
        isCreator,
        project: project ? 'loaded' : 'null'
    });

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Project not found</Text>
            </View>
        );
    }

    const todoTasks = tasks.filter(t => t.status === 'To-do');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
    const doneTasks = tasks.filter(t => t.status === 'Done');

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{project.title}</Text>
                {project.description && (
                    <Text style={styles.description}>{project.description}</Text>
                )}

                <View style={styles.infoRow}>
                    {project.course && (
                        <View style={styles.infoItem}>
                            <Ionicons name="book-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.infoText}>{project.course}</Text>
                        </View>
                    )}
                    {project.deadline && (
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                            <Text style={styles.infoText}>
                                {new Date(project.deadline).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.progressContainer}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${project.completion_percentage || 0}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {project.completed_tasks || 0} / {project.total_tasks || 0} tasks completed
                    </Text>
                </View>

                {isCreator && (
                    <View style={styles.creatorActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('InviteMember', {
                                projectId,
                                projectTitle: project.title
                            })}
                        >
                            <Ionicons name="person-add-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.actionButtonText}>Invite Member</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={handleDeleteProject}
                        >
                            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Project</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Team Chat Button - visible to all team members */}
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => navigation.navigate('ProjectChat', {
                        projectId,
                        projectTitle: project.title
                    })}
                >
                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                    <Text style={styles.chatButtonText}>Team Chat</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tasks</Text>

                {tasks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkbox-outline" size={48} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No tasks yet</Text>
                    </View>
                ) : (
                    <>
                        {todoTasks.length > 0 && (
                            <View style={styles.taskSection}>
                                <Text style={styles.taskSectionTitle}>To-do ({todoTasks.length})</Text>
                                {todoTasks.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onPress={() => { }}
                                        onTaskCompleted={fetchProjectDetails}
                                        onTaskDeleted={fetchProjectDetails}
                                        projectCreatorId={project?.created_by}
                                    />
                                ))}
                            </View>
                        )}

                        {inProgressTasks.length > 0 && (
                            <View style={styles.taskSection}>
                                <Text style={styles.taskSectionTitle}>In Progress ({inProgressTasks.length})</Text>
                                {inProgressTasks.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onPress={() => { }}
                                        onTaskCompleted={fetchProjectDetails}
                                        onTaskDeleted={fetchProjectDetails}
                                        projectCreatorId={project?.created_by}
                                    />
                                ))}
                            </View>
                        )}

                        {doneTasks.length > 0 && (
                            <View style={styles.taskSection}>
                                <Text style={styles.taskSectionTitle}>Done ({doneTasks.length})</Text>
                                {doneTasks.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onPress={() => { }}
                                        onTaskCompleted={fetchProjectDetails}
                                        onTaskDeleted={fetchProjectDetails}
                                        projectCreatorId={project?.created_by}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                )}
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateTask', { projectId })}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
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
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
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
        marginTop: theme.spacing.sm,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.border,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        marginBottom: theme.spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
        borderRadius: theme.borderRadius.full,
    },
    progressText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    section: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    taskSection: {
        marginBottom: theme.spacing.lg,
    },
    taskSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        textTransform: 'uppercase',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.sm,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.danger,
    },
    creatorActions: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.background,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
        marginLeft: theme.spacing.xs,
    },
    deleteButton: {
        borderColor: theme.colors.danger,
    },
    deleteButtonText: {
        color: theme.colors.danger,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary,
        marginTop: theme.spacing.md,
    },
    chatButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginLeft: theme.spacing.sm,
    },
    fab: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});

export default ProjectDetailsScreen;
