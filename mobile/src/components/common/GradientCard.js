import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

const GradientCard = ({ children, colors = theme.colors.gradient, onPress, style }) => {
    const CardComponent = onPress ? TouchableOpacity : View;

    return (
        <CardComponent onPress={onPress} activeOpacity={0.7}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, style]}
            >
                {children}
            </LinearGradient>
        </CardComponent>
    );
};

const styles = StyleSheet.create({
    gradient: {
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.md,
    },
});

export default GradientCard;
