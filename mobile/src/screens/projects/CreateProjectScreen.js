import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { theme } from '../../constants/theme';
import * as projectService from '../../services/projectService';

const CreateProjectSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string(),
    course: Yup.string(),
});

const CreateProjectScreen = ({ navigation }) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [deadline, setDeadline] = useState(new Date());

    const handleCreateProject = async (values, { setSubmitting }) => {
        const projectData = {
            title: values.title,
            description: values.description,
            course: values.course,
            deadline: deadline.toISOString().split('T')[0], // Format as YYYY-MM-DD
        };

        console.log('Creating project with data:', projectData);
        const result = await projectService.createProject(projectData);
        setSubmitting(false);

        if (result.success) {
            Alert.alert('Success', 'Project created successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } else {
            console.error('Project creation failed:', result.error);
            Alert.alert('Error', result.error || 'Failed to create project');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Formik
                    initialValues={{ title: '', description: '', course: '' }}
                    validationSchema={CreateProjectSchema}
                    onSubmit={handleCreateProject}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <View style={styles.form}>
                            <Input
                                label="Project Title *"
                                value={values.title}
                                onChangeText={handleChange('title')}
                                onBlur={handleBlur('title')}
                                placeholder="Enter project title"
                                error={touched.title && errors.title}
                                icon="document-text-outline"
                            />

                            <Input
                                label="Description"
                                value={values.description}
                                onChangeText={handleChange('description')}
                                onBlur={handleBlur('description')}
                                placeholder="Enter project description"
                                multiline
                                numberOfLines={4}
                                icon="create-outline"
                            />

                            <Input
                                label="Course"
                                value={values.course}
                                onChangeText={handleChange('course')}
                                onBlur={handleBlur('course')}
                                placeholder="e.g., CS101"
                                icon="school-outline"
                            />

                            <View style={styles.dateContainer}>
                                <Text style={styles.label}>Deadline</Text>
                                <Button
                                    title={deadline.toLocaleDateString()}
                                    onPress={() => setShowDatePicker(true)}
                                    variant="outline"
                                />
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={deadline}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            setDeadline(selectedDate);
                                        }
                                    }}
                                    minimumDate={new Date()}
                                />
                            )}

                            <Button
                                title="Create Project"
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
    dateContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
});

export default CreateProjectScreen;
