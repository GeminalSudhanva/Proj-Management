import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

// Dashboard
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Projects
import ProjectsListScreen from '../screens/projects/ProjectsListScreen';
import CreateProjectScreen from '../screens/projects/CreateProjectScreen';
import ProjectDetailsScreen from '../screens/projects/ProjectDetailsScreen';
import InviteMemberScreen from '../screens/projects/InviteMemberScreen';
import InviteMentorScreen from '../screens/projects/InviteMentorScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';

// Chat
import ChatScreen from '../screens/chat/ChatScreen';
import ProjectChatScreen from '../screens/chat/ProjectChatScreen';

// Profile
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import InvitationsScreen from '../screens/profile/InvitationsScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Projects Stack Navigator
const ProjectsStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="ProjectsList"
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="ProjectsList"
                component={ProjectsListScreen}
                options={{ title: 'Projects' }}
            />
            <Stack.Screen
                name="CreateProject"
                component={CreateProjectScreen}
                options={{ title: 'Create Project' }}
            />
            <Stack.Screen
                name="ProjectDetails"
                component={ProjectDetailsScreen}
                options={{ title: 'Project Details' }}
            />
            <Stack.Screen
                name="InviteMember"
                component={InviteMemberScreen}
                options={{ title: 'Invite Member' }}
            />
            <Stack.Screen
                name="InviteMentor"
                component={InviteMentorScreen}
                options={{ title: 'Invite Mentor' }}
            />
            <Stack.Screen
                name="ProjectChat"
                component={ProjectChatScreen}
                options={{ title: 'Team Chat' }}
            />
            <Stack.Screen
                name="CreateTask"
                component={CreateTaskScreen}
                options={{ title: 'Create Task' }}
            />
        </Stack.Navigator>
    );
};

// Profile Stack Navigator
const ProfileStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{ title: 'Change Password' }}
            />
            <Stack.Screen
                name="Invitations"
                component={InvitationsScreen}
                options={{ title: 'Invitations' }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ title: 'Notifications' }}
            />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Projects') {
                        iconName = focused ? 'folder' : 'folder-outline';
                    } else if (route.name === 'Chat') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Notifications') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.colors.primary },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Tab.Screen name="Projects" component={ProjectsStack} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.colors.primary },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
};

export default AppNavigator;
