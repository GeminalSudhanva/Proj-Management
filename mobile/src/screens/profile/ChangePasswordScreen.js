import React from 'react';
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
import * as authService from '../../services/authService';

const ChangePasswordSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
});

const ChangePasswordScreen = ({ navigation }) => {
    const handleChangePassword = async (values, { setSubmitting, resetForm }) => {
        try {
            await authService.changePassword(
                values.currentPassword,
                values.newPassword,
                values.confirmPassword
            );

            Alert.alert('Success', 'Password changed successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        resetForm();
                        navigation.goBack();
                    },
                },
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to change password');
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
                    initialValues={{
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    }}
                    validationSchema={ChangePasswordSchema}
                    onSubmit={handleChangePassword}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                        <View style={styles.form}>
                            <Input
                                label="Current Password *"
                                value={values.currentPassword}
                                onChangeText={handleChange('currentPassword')}
                                onBlur={handleBlur('currentPassword')}
                                placeholder="Enter current password"
                                secureTextEntry
                                error={touched.currentPassword && errors.currentPassword}
                                icon="lock-closed-outline"
                            />

                            <Input
                                label="New Password *"
                                value={values.newPassword}
                                onChangeText={handleChange('newPassword')}
                                onBlur={handleBlur('newPassword')}
                                placeholder="Enter new password"
                                secureTextEntry
                                error={touched.newPassword && errors.newPassword}
                                icon="key-outline"
                            />

                            <Input
                                label="Confirm New Password *"
                                value={values.confirmPassword}
                                onChangeText={handleChange('confirmPassword')}
                                onBlur={handleBlur('confirmPassword')}
                                placeholder="Confirm new password"
                                secureTextEntry
                                error={touched.confirmPassword && errors.confirmPassword}
                                icon="key-outline"
                            />

                            <Button
                                title="Change Password"
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
    submitButton: {
        marginTop: theme.spacing.md,
    },
});

export default ChangePasswordScreen;
