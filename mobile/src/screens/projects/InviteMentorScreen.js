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
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { theme } from '../../constants/theme';
import * as mentorService from '../../services/mentorService';
import { Ionicons } from '@expo/vector-icons';

const InviteMentorSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
});

const InviteMentorScreen = ({ route, navigation }) => {
    const { projectId, projectTitle } = route.params;

    const handleInvite = async (values, { setSubmitting, resetForm }) => {
        const result = await mentorService.requestMentor(projectId, values.email);
        setSubmitting(false);

        if (result.success) {
            Alert.alert('Success', 'Mentor request sent successfully!', [
                {
                    text: 'Invite Another',
                    onPress: () => resetForm(),
                },
                {
                    text: 'Done',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } else {
            Alert.alert('Error', result.error || 'Failed to send mentor request');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="school" size={32} color={theme.colors.secondary} />
                    </View>
                    <Text style={styles.title}>Invite Mentor</Text>
                    <Text style={styles.subtitle}>to {projectTitle}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.secondary} />
                    <Text style={styles.infoText}>
                        Mentors can view all project details, see task assignments, and delete the project if needed.
                    </Text>
                </View>

                <Formik
                    initialValues={{ email: '' }}
                    validationSchema={InviteMentorSchema}
                    onSubmit={handleInvite}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <View style={styles.form}>
                            <Input
                                label="Mentor Email *"
                                value={values.email}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                placeholder="Enter mentor's email address"
                                error={touched.email && errors.email}
                                icon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.note}>
                                The mentor will receive an invitation request. They can accept or decline.
                            </Text>

                            <Button
                                title="Send Mentor Request"
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
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.secondary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.secondary + '15',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.secondary,
    },
    infoText: {
        flex: 1,
        marginLeft: theme.spacing.sm,
        fontSize: 13,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    form: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
    },
    note: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        fontStyle: 'italic',
    },
    submitButton: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.secondary,
    },
});

export default InviteMentorScreen;
