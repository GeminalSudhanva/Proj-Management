import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    SectionList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import ProjectCard from '../../components/ProjectCard';
import { ProjectsListSkeleton } from '../../components/common/Skeleton';
import * as projectService from '../../services/projectService';
import * as searchService from '../../services/searchService';

const ProjectsListScreen = ({ navigation }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const fetchProjects = async () => {
        try {
            const result = await projectService.getProjects();
            if (result.success) {
                // Backend returns array directly
                setProjects(Array.isArray(result.data) ? result.data : []);
            } else {
                console.error('Failed to fetch projects:', result.error);
                setProjects([]);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            const result = await searchService.search(searchQuery);
            if (result.success) {
                setSearchResults(result);
            }
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Refresh when screen comes into focus (e.g., after creating a project)
    useFocusEffect(
        useCallback(() => {
            fetchProjects();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setSearchQuery('');
        setSearchResults(null);
        fetchProjects();
    }, []);

    const handleProjectPress = (project) => {
        navigation.navigate('ProjectDetails', { projectId: project._id });
    };

    const handleTaskPress = (task) => {
        navigation.navigate('ProjectDetails', { projectId: task.project_id });
    };

    const handleCreateProject = () => {
        navigation.navigate('CreateProject');
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults(null);
    };

    // Render search results
    const renderSearchResults = () => {
        if (!searchResults) return null;

        const sections = [];

        if (searchResults.projects && searchResults.projects.length > 0) {
            sections.push({
                title: 'Projects',
                data: searchResults.projects,
                type: 'project'
            });
        }

        if (searchResults.tasks && searchResults.tasks.length > 0) {
            sections.push({
                title: 'Tasks',
                data: searchResults.tasks,
                type: 'task'
            });
        }

        if (sections.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyText}>No results found</Text>
                    <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
            );
        }

        return (
            <SectionList
                sections={sections}
                keyExtractor={(item) => item._id}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{title}</Text>
                    </View>
                )}
                renderItem={({ item, section }) => {
                    if (section.type === 'project') {
                        return (
                            <ProjectCard
                                project={item}
                                onPress={() => handleProjectPress(item)}
                            />
                        );
                    } else {
                        return (
                            <TouchableOpacity
                                style={styles.taskCard}
                                onPress={() => handleTaskPress(item)}
                            >
                                <View style={styles.taskHeader}>
                                    <Ionicons
                                        name={item.status === 'Done' ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={20}
                                        color={item.status === 'Done' ? theme.colors.success : theme.colors.textSecondary}
                                    />
                                    <Text style={styles.taskTitle}>{item.title}</Text>
                                </View>
                                <Text style={styles.taskProject}>
                                    <Ionicons name="folder-outline" size={12} /> {item.project_title}
                                </Text>
                                {item.description && (
                                    <Text style={styles.taskDescription} numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                )}
                                <View style={styles.taskMeta}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                        <Text style={styles.statusText}>{item.status}</Text>
                                    </View>
                                    {item.due_date && (
                                        <Text style={styles.dueDate}>
                                            <Ionicons name="calendar-outline" size={12} /> {item.due_date}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }
                }}
                contentContainerStyle={styles.listContent}
            />
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return theme.colors.success + '20';
            case 'In Progress': return theme.colors.warning + '20';
            default: return theme.colors.info + '20';
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ProjectsListSkeleton />
                <TouchableOpacity style={styles.fab} onPress={handleCreateProject}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search projects and tasks..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Show loading indicator while searching */}
            {isSearching && (
                <View style={styles.searchingContainer}>
                    <Text style={styles.searchingText}>Searching...</Text>
                </View>
            )}

            {/* Search Results or Projects List */}
            {searchQuery.length >= 2 ? (
                renderSearchResults()
            ) : (
                <FlatList
                    data={projects}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <ProjectCard project={item} onPress={() => handleProjectPress(item)} />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="folder-open-outline" size={64} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>No projects yet</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to create your first project</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.fab} onPress={handleCreateProject}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: 16,
        color: theme.colors.text,
    },
    searchingContainer: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    searchingText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    sectionHeader: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
    taskCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    taskProject: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    taskDescription: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    taskMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text,
    },
    dueDate: {
        fontSize: 12,
        color: theme.colors.textSecondary,
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

export default ProjectsListScreen;
