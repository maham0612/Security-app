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
  Linking,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { WebView } from 'react-native-webview';
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
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{uri: string, fileName: string} | null>(null);
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
    
    // Debug logging for file messages only
    if (item.type !== 'text') {
      console.log('🎯 Rendering file message:', {
        id: item.id,
        type: item.type,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        isOwnMessage,
        senderId: item.senderId,
        userId: user?.id
      });
    }

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
              {/* Show image preview for image files */}
              {item.type === 'image' && item.fileUrl ? (
                <TouchableOpacity 
                  style={styles.imagePreviewContainer}
                  onPress={() => openFile(item.fileUrl!, item.fileName || 'Image', item.type)}
                >
                  <Image 
                    source={{ 
                      uri: item.fileUrl?.startsWith('http') ? item.fileUrl : `http://192.168.100.191:3000${item.fileUrl}`
                    }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('❌ Image load error:', error.nativeEvent.error);
                      console.log('❌ Image URL:', item.fileUrl?.startsWith('http') ? item.fileUrl : `http://192.168.100.191:3000${item.fileUrl}`);
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', item.fileUrl);
                    }}
                  />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageFileName}>{item.fileName}</Text>
                    <Text style={styles.imageFileSize}>{formatFileSize(item.fileSize || 0)}</Text>
                  </View>
                  <View style={styles.imagePlayButton}>
                    <Text style={styles.playButtonText}>👁️</Text>
                  </View>
                </TouchableOpacity>
              ) : item.type === 'audio' && item.fileUrl ? (
                <View style={[styles.fileMessageButton, isOwnMessage ? styles.ownFileButton : styles.otherFileButton]}>
                  <View style={styles.fileInfoContainer}>
                    <View style={styles.fileIconContainer}>
                      <Text style={styles.fileIcon}>🎵</Text>
                    </View>
                    <View style={styles.fileDetails}>
                      <Text style={[styles.fileName, isOwnMessage ? styles.ownFileName : styles.otherFileName]} numberOfLines={1}>
                        {item.fileName || 'Audio'}
                      </Text>
                      <Text style={[styles.fileSize, isOwnMessage ? styles.ownFileSize : styles.otherFileSize]}>
                        {formatFileSize(item.fileSize || 0)} • AUDIO
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setPlayingAudioId(prev => prev === item.id ? null : item.id)} 
                      style={styles.fileActionContainer}
                    >
                      <Text style={styles.fileActionIcon}>{playingAudioId === item.id ? '⏸️' : '▶️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Inline audio player via WebView with custom controls (reliable on Android) */}
                  {playingAudioId === item.id && (
                    <View style={{ height: 56, marginTop: 8, overflow: 'hidden', borderRadius: 8 }}>
                      <WebView
                        originWhitelist={["*"]}
                        javaScriptEnabled
                        domStorageEnabled
                        scrollEnabled={false}
                        mixedContentMode="always"
                        mediaPlaybackRequiresUserAction={false}
                        allowsFullscreenVideo={false}
                        allowsInlineMediaPlayback
                        source={{
                          html: `
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1\" />
                                <style>
                                  html,body{margin:0;padding:0;background:transparent}
                                  .wrap{display:flex;align-items:center;justify-content:flex-start;height:56px;padding:0 8px}
                                  button{width:40px;height:40px;border-radius:20px;border:none;background:#2e6be6;color:#fff;font-size:18px}
                                  .time{color:#222;margin-left:12px;font-family:Arial, sans-serif}
                                </style>
                              </head>
                              <body>
                                <div class=\"wrap\">
                                  <button id=\"pp\">▶</button>
                                  <span class=\"time\" id=\"t\">0:00</span>
                                  <audio id=\"a\" src=\"${item.fileUrl?.startsWith('http') ? item.fileUrl : `http://192.168.100.191:3000${item.fileUrl}`}\" preload=\"auto\" playsinline></audio>
                                </div>
                                <script>
                                  const a=document.getElementById('a');
                                  const b=document.getElementById('pp');
                                  const t=document.getElementById('t');
                                  const fmt=s=>{const m=Math.floor(s/60);const r=Math.floor(s%60);return m+':'+('0'+r).slice(-2)};
                                  b.addEventListener('click',()=>{ if(a.paused){ a.play().catch(()=>{}); b.textContent='⏸'; } else { a.pause(); b.textContent='▶'; } });
                                  a.addEventListener('timeupdate',()=>{ t.textContent=fmt(a.currentTime); });
                                  a.addEventListener('ended',()=>{ b.textContent='▶'; });
                                </script>
                              </body>
                            </html>
                          `
                        }}
                      />
                    </View>
                  )}
                </View>
              ) : (
                /* Show file info for non-image files */
                <TouchableOpacity 
                  style={[
                    styles.fileMessageButton,
                    isOwnMessage ? styles.ownFileButton : styles.otherFileButton
                  ]}
                  onPress={() => openFile(item.fileUrl || '', item.fileName || 'File', item.type)}
                >
                  <View style={styles.fileInfoContainer}>
                    <View style={styles.fileIconContainer}>
                      <Text style={styles.fileIcon}>{getFileIcon(item.type)}</Text>
                    </View>
                    <View style={styles.fileDetails}>
                      <Text style={[
                        styles.fileName,
                        isOwnMessage ? styles.ownFileName : styles.otherFileName
                      ]} numberOfLines={2}>
                        {item.fileName || 'Unknown File'}
                      </Text>
                      <Text style={[
                        styles.fileSize,
                        isOwnMessage ? styles.ownFileSize : styles.otherFileSize
                      ]}>
                        {formatFileSize(item.fileSize || 0)} • {item.type.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.fileActionContainer}>
                      <Text style={styles.fileActionIcon}>📂</Text>
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

  const openFile = async (fileUrl: string, fileName: string, fileType: string) => {
    try {
      // For images, show in full-screen modal
      if (fileType === 'image') {
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://192.168.100.191:3000${fileUrl}`;
        console.log('🖼️ Opening image URL:', fullUrl);
        setSelectedImage({ uri: fullUrl, fileName });
        setImageModalVisible(true);
      } else {
        // For other files, try to open with system apps
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://192.168.100.191:3000${fileUrl}`;
        console.log('🔗 Opening file URL:', fullUrl);
        
        // First try to open with system apps
        try {
          const canOpen = await Linking.canOpenURL(fullUrl);
          console.log('🔗 Can open URL:', canOpen);
          
          if (canOpen) {
            await Linking.openURL(fullUrl);
            return;
          }
        } catch (linkError) {
          console.log('🔗 Linking error:', linkError);
        }
        
        // If system app fails, try browser
        try {
          const browserUrl = fullUrl;
          const canOpenBrowser = await Linking.canOpenURL(browserUrl);
          
          if (canOpenBrowser) {
            await Linking.openURL(browserUrl);
            return;
          }
        } catch (browserError) {
          console.log('🌐 Browser error:', browserError);
        }
        
        // If all fails, show details
        Alert.alert(
          'File Details',
          `File: ${fileName}\nType: ${fileType}\nURL: ${fullUrl}\n\nCannot open this file type directly.`,
          [
            { text: 'OK' },
            { 
              text: 'Copy URL', 
              onPress: () => {
                Alert.alert('URL Copied', fullUrl);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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

      {/* Image Viewer Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <View style={styles.imageModalHeader}>
            <Text style={styles.imageModalTitle}>{selectedImage?.fileName}</Text>
            <TouchableOpacity
              style={styles.imageModalCloseButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.imageModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            style={styles.imageModalScrollView}
            contentContainerStyle={styles.imageModalContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {selectedImage && (
              <Image
                source={{ 
                  uri: selectedImage.uri
                }}
                style={styles.imageModalImage}
                resizeMode="contain"
                onError={(error) => {
                  console.log('❌ Modal image load error:', error.nativeEvent.error);
                  console.log('❌ Modal image URL:', selectedImage.uri);
                }}
                onLoad={() => {
                  console.log('✅ Modal image loaded successfully:', selectedImage.uri);
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
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
    minWidth: 200,
    maxWidth: 250,
  },
  ownFileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  otherFileButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ownFileName: {
    color: 'white',
  },
  otherFileName: {
    color: '#333',
  },
  fileSize: {
    fontSize: 11,
    opacity: 0.8,
  },
  ownFileSize: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherFileSize: {
    color: '#666',
  },
  fileActionContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileActionIcon: {
    fontSize: 14,
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 5,
    position: 'relative',
    maxWidth: 250,
  },
  imagePreview: {
    width: 250,
    height: 180,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  imageFileName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  imageFileSize: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  imagePlayButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 14,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 1,
  },
  imageModalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  imageModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageModalScrollView: {
    flex: 1,
    width: '100%',
  },
  imageModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  imageModalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
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
