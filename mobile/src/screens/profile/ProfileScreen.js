import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import api from '../../services/api';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, updateUser, deleteAccount } = useAuth();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        await logout();
                        setLoading(false);
                    },
                },
            ]
        );
    };

    const pickImage = async (useCamera = false) => {
        try {
            // Request permissions
            const permissionResult = useCamera
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to continue');
                return;
            }

            // Launch image picker or camera with legacy option for Android compatibility
            const result = useCamera
                ? await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                })
                : await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                    legacy: true, // Use legacy picker for Android compatibility
                });

            console.log('Image picker result:', result);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                await uploadProfilePicture(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', `Failed to pick image: ${error.message}`);
        }
    };

    const uploadProfilePicture = async (imageUri) => {
        try {
            setUploadingPicture(true);

            // Resize and compress image
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 400 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            // Upload to backend
            const response = await api.post('/api/profile/upload-picture', {
                profile_picture: `data:image/jpeg;base64,${manipulatedImage.base64}`
            });

            if (response.data.success) {
                // Update user context
                updateUser({ ...user, profile_picture: response.data.profile_picture });
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                Alert.alert('Error', response.data.message || 'Failed to upload picture');
            }
        } catch (error) {
            console.error('Error uploading picture:', error);
            Alert.alert('Error', 'Failed to upload profile picture');
        } finally {
            setUploadingPicture(false);
        }
    };

    const handleChangePhoto = () => {
        Alert.alert(
            'Change Profile Picture',
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: () => pickImage(true),
                },
                {
                    text: 'Choose from Library',
                    onPress: () => pickImage(false),
                },
                {
                    text: 'Remove Photo',
                    style: 'destructive',
                    onPress: handleRemovePhoto,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const handleRemovePhoto = async () => {
        try {
            setUploadingPicture(true);
            const response = await api.post('/api/profile/remove-picture');

            if (response.data.success) {
                updateUser({ ...user, profile_picture: null });
                Alert.alert('Success', 'Profile picture removed');
            }
        } catch (error) {
            console.error('Error removing picture:', error);
            Alert.alert('Error', 'Failed to remove picture');
        } finally {
            setUploadingPicture(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone. All your data, projects you created (where you are the only member), and associated information will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Account',
                    style: 'destructive',
                    onPress: () => {
                        // Double confirmation
                        Alert.alert(
                            'Final Confirmation',
                            'This is your last chance. Are you absolutely sure?',
                            [
                                { text: 'No, Keep Account', style: 'cancel' },
                                {
                                    text: 'Yes, Delete Forever',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setDeleting(true);
                                        const result = await deleteAccount();
                                        setDeleting(false);
                                        if (!result.success) {
                                            Alert.alert('Error', result.error || 'Failed to delete account');
                                        }
                                        // If successful, AuthContext will handle navigation
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const menuItems = [
        {
            icon: 'person-outline',
            title: 'Edit Profile',
            onPress: () => navigation.navigate('EditProfile'),
        },
        {
            icon: 'key-outline',
            title: 'Change Password',
            onPress: () => navigation.navigate('ChangePassword'),
        },
        {
            icon: 'mail-outline',
            title: 'Invitations',
            onPress: () => navigation.navigate('Invitations'),
        },
        {
            icon: 'trash-outline',
            title: 'Delete Account',
            onPress: handleDeleteAccount,
            danger: true,
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Avatar user={user} size="xlarge" showBorder={true} />
                    <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={handleChangePhoto}
                        disabled={uploadingPicture}
                    >
                        {uploadingPicture ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="camera" size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.name}>{user?.name || 'Loading...'}</Text>
                <Text style={styles.email}>{user?.email || 'Loading...'}</Text>
            </View>

            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={`menu-${index}`}
                        style={[styles.menuItem, item.danger && styles.menuItemDanger]}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                        disabled={deleting}
                    >
                        <View style={styles.menuItemLeft}>
                            <Ionicons name={item.icon} size={24} color={item.danger ? theme.colors.error : theme.colors.text} />
                            <Text style={[styles.menuItemText, item.danger && styles.menuItemTextDanger]}>{item.title}</Text>
                        </View>
                        {item.danger && deleting ? (
                            <ActivityIndicator size="small" color={theme.colors.error} />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color={item.danger ? theme.colors.error : theme.colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.logoutContainer}>
                <Button
                    title="Logout"
                    onPress={handleLogout}
                    variant="danger"
                    loading={loading}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    avatarContainer: {
        marginBottom: theme.spacing.md,
        position: 'relative',
    },
    changePhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.colors.card,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    email: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    menuContainer: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: theme.colors.text,
        marginLeft: theme.spacing.md,
    },
    menuItemDanger: {
        backgroundColor: 'rgba(255, 59, 48, 0.05)',
    },
    menuItemTextDanger: {
        color: theme.colors.error,
    },
    logoutContainer: {
        padding: theme.spacing.lg,
    },
});

export default ProfileScreen;
