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
import * as projectService from '../../services/projectService';

const InviteMemberSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
});

const InviteMemberScreen = ({ route, navigation }) => {
    const { projectId, projectTitle } = route.params;

    const handleInvite = async (values, { setSubmitting, resetForm }) => {
        const result = await projectService.inviteMember(projectId, values.email);
        setSubmitting(false);

        if (result.success) {
            Alert.alert('Success', 'Invitation sent successfully!', [
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
            Alert.alert('Error', result.error || 'Failed to send invitation');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Invite Member</Text>
                    <Text style={styles.subtitle}>to {projectTitle}</Text>
                </View>

                <Formik
                    initialValues={{ email: '' }}
                    validationSchema={InviteMemberSchema}
                    onSubmit={handleInvite}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <View style={styles.form}>
                            <Input
                                label="Member Email *"
                                value={values.email}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                placeholder="Enter email address"
                                error={touched.email && errors.email}
                                icon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            <Text style={styles.note}>
                                The user will receive an invitation to join this project.
                            </Text>

                            <Button
                                title="Send Invitation"
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
        marginBottom: theme.spacing.lg,
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
    },
});

export default InviteMemberScreen;
