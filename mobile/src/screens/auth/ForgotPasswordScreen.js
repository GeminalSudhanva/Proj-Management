import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordScreen = ({ navigation }) => {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Email is invalid');
            return;
        }

        setLoading(true);
        try {
            const result = await forgotPassword(email);
            if (result.success) {
                Alert.alert(
                    'Success',
                    'Password reset email has been sent. Check your inbox.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                Alert.alert('Error', result.error || 'Failed to send reset email');
            }
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={theme.colors.gradient}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            Enter your email and we'll send you instructions to reset your password
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError('');
                            }}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon="mail-outline"
                            error={error}
                        />

                        <Button
                            title="Send Reset Link"
                            onPress={handleSubmit}
                            loading={loading}
                            style={styles.submitButton}
                        />

                        <Button
                            title="Back to Login"
                            onPress={() => navigation.navigate('Login')}
                            variant="outline"
                            style={styles.backButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.md,
    },
    form: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
    backButton: {
        marginTop: theme.spacing.md,
    },
});

export default ForgotPasswordScreen;
