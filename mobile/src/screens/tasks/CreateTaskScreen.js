import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { theme } from '../../constants/theme';
import * as taskService from '../../services/taskService';
import * as projectService from '../../services/projectService';
import api from '../../services/api';

const CreateTaskSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
});

const CreateTaskScreen = ({ route, navigation }) => {
    const { projectId } = route.params;
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dueDate, setDueDate] = useState(new Date());
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(true);

    useEffect(() => {
        fetchProjectDetails();
    }, []);

    const fetchProjectDetails = async () => {
        try {
            console.log('Fetching project details for projectId:', projectId);
            const response = await projectService.getProjectDetails(projectId);
            console.log('Full API response:', JSON.stringify(response, null, 2));

            if (response.success && response.data) {
                const project = response.data;
                console.log('Project data extracted:', JSON.stringify(project, null, 2));
                console.log('created_by:', project.created_by);
                console.log('team_members:', project.team_members);

                // Get all team members including creator
                const allMemberIds = [];

                // Add creator if exists
                if (project.created_by) {
                    console.log('Adding creator:', project.created_by);
                    allMemberIds.push(project.created_by);
                }

                // Add team members if exists
                if (project.team_members && Array.isArray(project.team_members)) {
                    console.log('Adding team members:', project.team_members);
                    allMemberIds.push(...project.team_members);
                }

                // Remove duplicates and filter out undefined/null
                const uniqueMemberIds = [...new Set(allMemberIds)].filter(id => id);

                console.log('Unique member IDs:', uniqueMemberIds);

                if (uniqueMemberIds.length === 0) {
                    console.warn('No team members found! Project data:', project);
                    setLoadingMembers(false);
                    return;
                }

                // Fetch user details for each member
                const membersPromises = uniqueMemberIds.map(async (userId) => {
                    try {
                        console.log('Fetching user details for:', userId);
                        const userResponse = await api.get(`/api/user/${userId}`);
                        console.log('User response for', userId, ':', userResponse.data);
                        return {
                            id: userId,
                            name: userResponse.data.name || userResponse.data.email || 'Unknown User'
                        };
                    } catch (error) {
                        console.error(`Error fetching user ${userId}:`, error);
                        return null; // Return null for failed fetches
                    }
                });

                const members = (await Promise.all(membersPromises)).filter(m => m !== null);
                console.log('Team members loaded:', members);
                setTeamMembers(members);
            } else {
                console.error('API response not successful or no data:', response);
            }
        } catch (error) {
            console.error('Error fetching project details:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleCreateTask = async (values, { setSubmitting }) => {
        const taskData = {
            title: values.title,
            description: values.description,
            status: 'To-do',
            due_date: dueDate.toISOString().split('T')[0],
            assigned_to: selectedAssignee || null,
        };

        console.log('Creating task with data:', taskData);
        const result = await taskService.createTask(projectId, taskData);
        setSubmitting(false);

        if (result.success) {
            Alert.alert('Success', 'Task created successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } else {
            console.error('Task creation failed:', result.error);
            Alert.alert('Error', result.error || 'Failed to create task');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Formik
                    initialValues={{ title: '', description: '' }}
                    validationSchema={CreateTaskSchema}
                    onSubmit={handleCreateTask}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <View style={styles.form}>
                            <Input
                                label="Task Title *"
                                value={values.title}
                                onChangeText={handleChange('title')}
                                onBlur={handleBlur('title')}
                                placeholder="Enter task title"
                                error={touched.title && errors.title}
                                icon="checkbox-outline"
                            />

                            <Input
                                label="Description"
                                value={values.description}
                                onChangeText={handleChange('description')}
                                onBlur={handleBlur('description')}
                                placeholder="Enter task description"
                                multiline
                                numberOfLines={4}
                                icon="create-outline"
                            />

                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Assign To</Text>
                                {loadingMembers ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                ) : (
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedAssignee}
                                            onValueChange={(value) => setSelectedAssignee(value)}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Unassigned" value="" />
                                            {teamMembers.map((member) => (
                                                <Picker.Item
                                                    key={member.id}
                                                    label={member.name}
                                                    value={member.id}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                )}
                            </View>

                            <View style={styles.dateContainer}>
                                <Text style={styles.label}>Due Date</Text>
                                <Button
                                    title={dueDate.toLocaleDateString()}
                                    onPress={() => setShowDatePicker(true)}
                                    variant="outline"
                                />
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dueDate}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            setDueDate(selectedDate);
                                        }
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}

                            <Button
                                title="Create Task"
                                onPress={handleSubmit}
                                loading={isSubmitting}
                                style={styles.submitButton}
                            />
                        </View>
                    )}
                </Formik>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    form: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
    },
    fieldContainer: {
        marginBottom: theme.spacing.md,
    },
    dateContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    pickerContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    picker: {
        color: theme.colors.text,
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
});

export default CreateTaskScreen;
