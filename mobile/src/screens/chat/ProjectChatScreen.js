import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';

const ProjectChatScreen = ({ route }) => {
    const { projectId, projectTitle } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [mentors, setMentors] = useState([]);
    const flatListRef = useRef(null);

    // Fetch project to get mentors list
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`https://proj-management-mobile.onrender.com/api/project/${projectId}`);
                const data = await response.json();
                if (data.mentors) {
                    setMentors(data.mentors);
                }
            } catch (error) {
                console.log('Could not fetch project mentors:', error);
            }
        };
        fetchProject();
    }, [projectId]);

    useEffect(() => {
        // Connect to Socket.IO
        socketService.connect();

        // Join project room
        socketService.joinProjectRoom(projectId);

        // Listen for new project messages
        socketService.onNewProjectMessage((message) => {
            console.log('New project message received:', message);
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(msg => msg._id === message._id)) {
                    return prev;
                }
                // Add message and sort by createdAt (newest first for inverted FlatList)
                const newMessages = [message, ...prev];
                return newMessages.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
            });
        });

        // Get project message history
        socketService.getProjectMessages(projectId);
        socketService.onProjectMessagesHistory((history) => {
            console.log('Project message history received:', history.length);
            // Sort by createdAt (newest first for inverted FlatList)
            const sortedHistory = history.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setMessages(sortedHistory);
        });

        // Listen for message deletions
        socketService.onMessageDeleted((data) => {
            if (data.type === 'project') {
                console.log('Project message deleted:', data.messageId);
                setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
            }
        });

        return () => {
            socketService.leaveProjectRoom(projectId);
            socketService.removeAllListeners();
        };
    }, [projectId]);

    const handleSend = () => {
        if (inputText.trim() && user) {
            socketService.sendProjectMessage(
                inputText.trim(),
                user.id,
                user.name,
                projectId
            );
            setInputText('');
        }
    };

    const handleDeleteMessage = (messageId) => {
        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        socketService.deleteProjectMessage(messageId, user?.id, projectId);
                    },
                },
            ]
        );
    };

    const renderMessage = ({ item }) => {
        const isMyMessage = item.user._id === (user?.id || 'user');
        const isMentor = mentors.includes(item.user._id);

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessage : styles.otherMessage
            ]}>
                {!isMyMessage && (
                    <View style={styles.senderRow}>
                        <Text style={styles.senderName}>{item.user.name}</Text>
                        {isMentor && (
                            <View style={styles.mentorBadge}>
                                <Text style={styles.mentorBadgeText}>Mentor</Text>
                            </View>
                        )}
                    </View>
                )}
                <View style={styles.messageRow}>
                    <View style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myBubble : styles.otherBubble
                    ]}>
                        <Text style={[
                            styles.messageText,
                            isMyMessage ? styles.myText : styles.otherText
                        ]}>
                            {item.text}
                        </Text>
                    </View>
                    {isMyMessage && (
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteMessage(item._id)}
                        >
                            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.timestamp}>
                    {(() => {
                        const msgDate = new Date(item.createdAt);
                        const today = new Date();
                        const isToday = msgDate.toDateString() === today.toDateString();

                        if (isToday) {
                            return msgDate.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        } else {
                            return msgDate.toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    })()}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={90}
        >
            <View style={styles.header}>
                <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.headerText}>Team Chat - {projectTitle}</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                inverted
                contentContainerStyle={styles.messagesList}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Start chatting with your team!</Text>
                    </View>
                }
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Ionicons
                        name="send"
                        size={24}
                        color={inputText.trim() ? '#fff' : theme.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: theme.spacing.xs,
    },
    messagesList: {
        padding: theme.spacing.md,
    },
    messageContainer: {
        marginBottom: theme.spacing.md,
        maxWidth: '80%',
    },
    myMessage: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        marginLeft: theme.spacing.sm,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageBubble: {
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        maxWidth: '100%',
    },
    myBubble: {
        backgroundColor: theme.colors.primary,
    },
    otherBubble: {
        backgroundColor: theme.colors.card,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    myText: {
        color: '#fff',
    },
    otherText: {
        color: theme.colors.text,
    },
    timestamp: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginTop: 4,
        marginHorizontal: theme.spacing.sm,
    },
    deleteButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        maxHeight: 100,
        fontSize: 14,
        color: theme.colors.text,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: theme.colors.border,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
        transform: [{ scaleY: -1 }],
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    emptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    senderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        marginLeft: theme.spacing.sm,
    },
    mentorBadge: {
        backgroundColor: theme.colors.secondary,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: theme.spacing.xs,
    },
    mentorBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
});

export default ProjectChatScreen;
