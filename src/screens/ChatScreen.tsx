import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import ScreenshotProtection from '../utils/ScreenshotProtection';
import NotificationService from '../services/NotificationService';
import { Chat } from '../types';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
  isRead: boolean;
  isEncrypted: boolean;
  expiresAt: string;
  daysUntilExpiry: number;
}


interface ChatScreenProps {
  chat: Chat;
  onBack: () => void;
  onNavigateToFileShare?: () => void;
  fileMessage?: any;
  onFileMessageHandled?: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ chat, onBack, onNavigateToFileShare, fileMessage, onFileMessageHandled }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    loadMessages();
    setupSocketListeners();
    socketService.joinChat(chat.id);
    
    // Enable screenshot protection
    ScreenshotProtection.enable();
    
    // Request notification permissions
    NotificationService.requestPermissions();
    
    // Test notification (remove this in production)
    setTimeout(() => {
      console.log('🔔 Testing notification...');
      NotificationService.sendLocalNotification('🔔 SecureChat', 'Notifications are working! You will receive alerts for new messages.');
    }, 3000);

    // Keyboard event listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      socketService.leaveChat(chat.id);
      socketService.off('new_message');
      socketService.off('typing_start');
      socketService.off('typing_stop');
      
      // Disable screenshot protection when leaving chat
      ScreenshotProtection.disable();
      
      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Remove keyboard listeners
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [chat.id]);

  // Handle file message from FileShareScreen
  useEffect(() => {
    if (fileMessage) {
      console.log('📨 Adding file message to chat:', fileMessage);
      console.log('📨 File message type:', fileMessage.type);
      console.log('📨 File message fileName:', fileMessage.fileName);
      console.log('📨 File message fileUrl:', fileMessage.fileUrl);
      setMessages(prev => {
        const newMessages = [...prev, fileMessage];
        console.log('📨 Updated messages array length:', newMessages.length);
        console.log('📨 Last message in array:', newMessages[newMessages.length - 1]);
        return newMessages;
      });
      scrollToBottom();
      onFileMessageHandled?.();
    }
  }, [fileMessage]);

  const setupSocketListeners = () => {
    socketService.on('new_message', (data) => {
      if (data.chatId === chat.id) {
        // Don't add our own messages via socket since we handle them optimistically
        if (data.senderId === user?.id) {
          return;
        }
        
        // Check if message already exists to prevent duplicates
        setMessages(prev => {
          const messageExists = prev.some(msg => 
            msg.id === data.id || 
            (msg.senderId === data.senderId && msg.content === data.content && msg.timestamp === data.timestamp)
          );
          
          if (messageExists) {
            return prev;
          }
          
          return [...prev, data];
        });
        scrollToBottom();
        
        // Send notification for new message (only if app is in background or different chat)
        console.log('🔔 New message received from:', data.senderName);
        // Always show notification for new messages
        NotificationService.sendLocalNotification(
          `💬 New message from ${data.senderName}`,
          data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content
        );
      }
    });

    socketService.on('typing_start', (data) => {
      if (data.chatId === chat.id && data.userId !== user?.id) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
      }
    });

    socketService.on('typing_stop', (data) => {
      if (data.chatId === chat.id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    });
  };

  const loadMessages = async () => {
    try {
      const messageData = await apiService.get<Message[]>(`/messages/chats/${chat.id}/messages`);
      setMessages(messageData);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      chatId: chat.id,
      senderId: user?.id || '',
      senderName: user?.name || 'You',
      senderAvatar: user?.avatar,
      content: messageContent,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
      isEncrypted: chat.isEncrypted,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      daysUntilExpiry: 7,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      // Send to API (for persistence)
      const message = await apiService.post<Message>(`/messages/chats/${chat.id}/messages`, {
        content: messageContent,
        type: 'text',
      });

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? message : msg
      ));
      
      // Send via socket after API success (for real-time to other users)
      socketService.sendMessage(chat.id, messageContent, 'text');
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      socketService.startTyping(chat.id);
    }
    
    // Set timeout to stop typing after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socketService.stopTyping(chat.id);
      }
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAnonymousName = (originalName: string) => {
    const hash = originalName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `Anonymous User ${Math.abs(hash) % 10000}`;
  };

  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'image': return '🖼️';
      case 'file': return '📄';
      case 'document': return '📄';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      default: return '📁';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    const displayName = isAdmin ? item.senderName : getAnonymousName(item.senderName);
    
    // Debug logging for all messages
    console.log('🎯 Rendering message:', {
      id: item.id,
      type: item.type,
      content: item.content,
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      isOwnMessage,
      senderId: item.senderId,
      userId: user?.id
    });

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{displayName}</Text>
          )}
          
          {/* Handle file messages */}
          {item.type !== 'text' ? (
            <View style={styles.fileMessageContainer}>
              <Text style={[styles.messageText, { color: 'red', fontSize: 12 }]}>
                DEBUG: File message detected - Type: {item.type}
              </Text>
              {/* Show image preview for image files */}
              {item.type === 'image' && item.fileUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: item.fileUrl }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageFileName}>{item.fileName}</Text>
                  </View>
                </View>
              ) : (
                /* Show file info for non-image files */
                <TouchableOpacity 
                  style={[
                    styles.fileMessageButton,
                    isOwnMessage ? styles.ownFileButton : styles.otherFileButton
                  ]}
                  onPress={() => {
                    // Handle file download/preview
                    Alert.alert(
                      'File Details', 
                      `File: ${item.fileName}\nType: ${item.type}\nSize: ${formatFileSize(item.fileSize || 0)}`
                    );
                  }}
                >
                  <View style={styles.fileInfoContainer}>
                    <Text style={styles.fileIcon}>{getFileIcon(item.type)}</Text>
                    <View style={styles.fileDetails}>
                      <Text style={[
                        styles.fileName,
                        isOwnMessage ? styles.ownFileName : styles.otherFileName
                      ]}>
                        {item.fileName || 'Unknown File'}
                      </Text>
                      <Text style={[
                        styles.fileSize,
                        isOwnMessage ? styles.ownFileSize : styles.otherFileSize
                      ]}>
                        {formatFileSize(item.fileSize || 0)} • {item.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(item.timestamp)}
            </Text>
            {item.isEncrypted && (
              <Text style={styles.encryptedIcon}>🔒</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUsers.length === 1 
            ? 'Someone is typing...' 
            : `${typingUsers.length} people are typing...`
          }
        </Text>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {isAdmin ? chat.name : getAnonymousName(chat.name)}
          </Text>
          <Text style={styles.headerSubtitle}>
            {chat.type === 'group' ? 'Group Chat' : 'Personal Chat'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {chat.isEncrypted && (
            <Text style={styles.encryptedBadge}>🔒</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={renderTypingIndicator}
        />

        <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight * 0.1 : 0 }]}>
          <TouchableOpacity
            style={styles.fileButton}
            onPress={onNavigateToFileShare}
          >
            <Text style={styles.fileButtonText}>📎</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.sendButton, newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  encryptedBadge: {
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  encryptedIcon: {
    fontSize: 8,
    marginLeft: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  typingText: {
    fontSize: 14,
    color: '#999',
    marginRight: 10,
  },
  typingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  dot1: {
    // Animation delay handled by component logic
  },
  dot2: {
    // Animation delay handled by component logic
  },
  dot3: {
    // Animation delay handled by component logic
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileButtonText: {
    fontSize: 16,
  },
  fileMessageContainer: {
    marginVertical: 5,
  },
  fileMessageButton: {
    borderRadius: 12,
    padding: 12,
    marginTop: 5,
    borderWidth: 1,
  },
  ownFileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  otherFileButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderColor: '#667eea',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  ownFileName: {
    color: 'white',
  },
  otherFileName: {
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    opacity: 0.8,
  },
  ownFileSize: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherFileSize: {
    color: '#666',
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 5,
  },
  imagePreview: {
    width: 200,
    height: 150,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  imageFileName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  sendButtonInactive: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
  },
});

export default ChatScreen;
