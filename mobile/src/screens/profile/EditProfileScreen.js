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
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

const EditProfileSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
});

const EditProfileScreen = ({ navigation }) => {
    const { user, updateUser } = useAuth();

    const handleUpdateProfile = async (values, { setSubmitting }) => {
        try {
            await authService.updateProfile(values.name);

            // Update user in context
            await updateUser({
                ...user,
                name: values.name,
            });

            Alert.alert('Success', 'Profile updated successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Formik
                    initialValues={{ name: user?.name || '' }}
                    validationSchema={EditProfileSchema}
                    onSubmit={handleUpdateProfile}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <View style={styles.form}>
                            <Input
                                label="Name *"
                                value={values.name}
                                onChangeText={handleChange('name')}
                                onBlur={handleBlur('name')}
                                placeholder="Enter your name"
                                error={touched.name && errors.name}
                                icon="person-outline"
                            />

                            <View style={styles.emailContainer}>
                                <Text style={styles.label}>Email</Text>
                                <Text style={styles.emailText}>{user?.email}</Text>
                                <Text style={styles.emailNote}>Email cannot be changed</Text>
                            </View>

                            <Button
                                title="Update Profile"
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
    emailContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    emailText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    emailNote: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
});

export default EditProfileScreen;
