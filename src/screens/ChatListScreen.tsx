import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import NotificationService from '../services/NotificationService';
import { Chat } from '../types';

interface ChatListScreenProps {
  onChatSelect: (chat: Chat) => void;
  onNavigateToUsers: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToCreateGroup: () => void;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({
  onChatSelect,
  onNavigateToUsers,
  onNavigateToAdmin,
  onNavigateToCreateGroup,
}) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    loadChats();
    setupSocketListeners();
    
    // Request notification permissions
    NotificationService.requestPermissions();
    
    return () => {
      socketService.off('new_message');
      socketService.off('message_updated');
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.on('new_message', (data) => {
      // Update chat list when new message arrives
      loadChats();
      
      // Show notification for new message
      if (data.senderId !== user?.id) {
        console.log('🔔 New message notification from chat list');
        NotificationService.sendLocalNotification(
          `💬 New message from ${data.senderName}`,
          data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content
        );
      }
    });

    socketService.on('message_updated', (data) => {
      // Update chat list when message is updated
      loadChats();
    });
  };

  const loadChats = async () => {
    try {
      const chatData = await apiService.get<Chat[]>('/chats');
      setChats(chatData);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getAnonymousName = (originalName: string) => {
    // Generate anonymous name based on user ID or name hash
    const hash = originalName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `Anonymous User ${Math.abs(hash) % 10000}`;
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onChatSelect(item)}
    >
      <View style={styles.chatAvatar}>
        <Text style={styles.avatarText}>
          {item.type === 'group' ? '👥' : '👤'}
        </Text>
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>
            {isAdmin ? item.name : getAnonymousName(item.name)}
          </Text>
          <Text style={styles.chatTime}>
            {formatTime(item.lastMessageTime)}
          </Text>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage 
            ? `${item.lastMessage.senderName}: ${item.lastMessage.content}`
            : 'No messages yet'
          }
        </Text>
        
        {item.isEncrypted && (
          <View style={styles.encryptedBadge}>
            <Text style={styles.encryptedText}>🔒 Encrypted</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            socketService.disconnect();
            logout();
          }
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🔒 SecureChat</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, {isAdmin ? user?.name : 'Anonymous User'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={onNavigateToAdmin}
            >
              <Text style={styles.adminButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onNavigateToUsers}
          >
            <Text style={styles.actionButtonText}>👥 Start Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onNavigateToCreateGroup}
          >
            <Text style={styles.actionButtonText}>👥 Create Group</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with someone!
              </Text>
            </View>
          }
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  adminButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminButtonText: {
    fontSize: 18,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
  actionsBar: {
    paddingHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  encryptedBadge: {
    alignSelf: 'flex-start',
  },
  encryptedText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default ChatListScreen;
