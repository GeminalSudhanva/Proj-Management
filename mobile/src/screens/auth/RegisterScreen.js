import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../services/googleAuthService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { theme } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
    const { register, signInWithGoogle } = useAuth();
    const { request, response, promptAsync } = useGoogleAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Handle Google auth response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSignIn(id_token);
        } else if (response?.type === 'error') {
            Alert.alert('Error', 'Google sign-up was cancelled or failed');
            setGoogleLoading(false);
        }
    }, [response]);

    const handleGoogleSignIn = async (idToken) => {
        setGoogleLoading(true);
        const result = await signInWithGoogle(idToken);
        setGoogleLoading(false);

        if (!result.success) {
            Alert.alert('Google Sign-Up Failed', result.error || 'Please try again');
        }
    };

    const handleGooglePress = async () => {
        setGoogleLoading(true);
        try {
            await promptAsync();
        } catch (error) {
            Alert.alert('Error', 'Failed to start Google sign-up');
            setGoogleLoading(false);
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        const result = await register(name, email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Registration Failed', result.error || 'Please try again');
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Google Sign-Up Button - at top for prominence */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGooglePress}
                            disabled={!request || googleLoading}
                        >
                            <Image
                                source={{ uri: 'https://www.google.com/favicon.ico' }}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleButtonText}>
                                {googleLoading ? 'Signing up...' : 'Continue with Google'}
                            </Text>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View>

                        <Input
                            label="Full Name"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                setErrors({ ...errors, name: '' });
                            }}
                            placeholder="Enter your name"
                            icon="person-outline"
                            error={errors.name}
                        />

                        <Input
                            label="Email"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors({ ...errors, email: '' });
                            }}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon="mail-outline"
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: '' });
                            }}
                            placeholder="Create a password"
                            secureTextEntry={true}
                            icon="lock-closed-outline"
                            error={errors.password}
                        />

                        <Input
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setErrors({ ...errors, confirmPassword: '' });
                            }}
                            placeholder="Confirm your password"
                            secureTextEntry={true}
                            icon="lock-closed-outline"
                            error={errors.confirmPassword}
                        />

                        <Button
                            title="Sign Up"
                            onPress={handleRegister}
                            loading={loading}
                            style={styles.registerButton}
                        />

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
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
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: theme.borderRadius.md,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border || '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: theme.spacing.md,
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    registerButton: {
        marginTop: theme.spacing.md,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    loginText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
    },
    loginLink: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default RegisterScreen;
