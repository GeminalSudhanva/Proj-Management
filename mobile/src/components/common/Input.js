import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    error,
    icon,
    multiline,
    numberOfLines,
    autoCapitalize,
    keyboardType,
    ...props
}) => {
    const [isSecure, setIsSecure] = useState(!!secureTextEntry);

    return (
        <View style={styles.container} >
            {label && <Text style={styles.label}>{label}</Text>}
            < View style={[styles.inputContainer, error && styles.inputError]} >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={20}
                        color={theme.colors.textSecondary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.multilineInput,
                        icon && styles.inputWithIcon,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    secureTextEntry={!!isSecure}
                    multiline={!!multiline}
                    numberOfLines={numberOfLines}
                    autoCapitalize={autoCapitalize || 'sentences'}
                    keyboardType={keyboardType || 'default'}
                    {...props}
                />
                {
                    secureTextEntry && (
                        <TouchableOpacity
                            onPress={() => setIsSecure(!isSecure)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )
                }
            </View >
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
    },
    inputError: {
        borderColor: theme.colors.danger,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    inputWithIcon: {
        paddingLeft: theme.spacing.xs,
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    icon: {
        marginRight: theme.spacing.xs,
    },
    eyeIcon: {
        padding: theme.spacing.xs,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: theme.spacing.xs,
    },
});

export default Input;
