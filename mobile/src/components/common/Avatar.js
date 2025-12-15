import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

const Avatar = ({
    user,
    size = 'medium',
    style,
    showBorder = true
}) => {
    const sizes = {
        small: 32,
        medium: 48,
        large: 80,
        xlarge: 120
    };

    const fontSize = {
        small: 14,
        medium: 18,
        large: 32,
        xlarge: 48
    };

    const avatarSize = sizes[size];
    const textSize = fontSize[size];

    const getInitials = () => {
        if (!user?.name) return '?';
        const names = user.name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return user.name.substring(0, 2).toUpperCase();
    };

    const hasProfilePicture = user?.profile_picture && user.profile_picture.trim() !== '';

    return (
        <View
            style={[
                styles.container,
                {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    borderWidth: showBorder ? 2 : 0,
                },
                style
            ]}
        >
            {hasProfilePicture ? (
                <Image
                    source={{ uri: user.profile_picture }}
                    style={{
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarSize / 2,
                    }}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={[
                        styles.initialsContainer,
                        {
                            width: avatarSize,
                            height: avatarSize,
                            borderRadius: avatarSize / 2,
                        }
                    ]}
                >
                    <Text style={[styles.initials, { fontSize: textSize }]}>
                        {getInitials()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    initialsContainer: {
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default Avatar;
