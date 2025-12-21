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
import Avatar from '../../components/common/Avatar';

const ChatScreen = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    useEffect(() => {
        // Connect to Socket.IO
        socketService.connect();

        // Listen for new messages
        socketService.onNewGlobalMessage((message) => {
            console.log('New global message received:', message);
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

        // Get message history
        socketService.getGlobalMessages();
        socketService.onGlobalMessagesHistory((history) => {
            console.log('Message history received:', history.length);
            // Sort by createdAt (newest first for inverted FlatList)
            const sortedHistory = history.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setMessages(sortedHistory);
        });

        // Listen for message deletions
        socketService.onMessageDeleted((data) => {
            if (data.type === 'global') {
                console.log('Message deleted:', data.messageId);
                setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
            }
        });

        return () => {
            socketService.removeAllListeners();
        };
    }, []);

    const handleSend = () => {
        if (inputText.trim() && user) {
            socketService.sendGlobalMessage(
                inputText.trim(),
                user.id,
                user.name
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
                        socketService.deleteGlobalMessage(messageId, user?.id);
                    },
                },
            ]
        );
    };

    const renderMessage = ({ item }) => {
        const isMyMessage = item.userId === user?.id;

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
                {!isMyMessage && (
                    <Avatar
                        user={{ name: item.userName, profile_picture: item.userProfilePicture }}
                        size="small"
                        showBorder={false}
                        style={styles.messageAvatar}
                    />
                )}
                <View style={{ flex: 1 }}>
                    {!isMyMessage && (
                        <Text style={styles.senderName}>{item.userName}</Text>
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
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
            keyboardVerticalOffset={90}
        >
            <View style={styles.titleHeader}>
                <Ionicons name="globe-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.titleText}>Global Chat</Text>
            </View>
            <View style={styles.header}>
                <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.headerText}>Messages auto-delete after 24 hours</Text>
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
                        <Text style={styles.emptySubtext}>Start the conversation!</Text>
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
        justifyContent: 'center',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.xs,
        fontStyle: 'italic',
    },
    messagesList: {
        padding: theme.spacing.md,
    },
    messageContainer: {
        marginBottom: theme.spacing.md,
        maxWidth: '80%',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    messageAvatar: {
        marginRight: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
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
    titleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    titleText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
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
});

export default ChatScreen;
