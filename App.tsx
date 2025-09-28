import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { socketService } from './src/services/socket';
import NotificationService from './src/services/NotificationService';
import { Chat, User } from './src/types';

// Chat App Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import UsersScreen from './src/screens/UsersScreen';
import AdminScreen from './src/screens/AdminScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import FileShareScreen from './src/screens/FileShareScreen';

const queryClient = new QueryClient();

type Screen = 
  | 'login'
  | 'register'
  | 'chatList'
  | 'chat'
  | 'users'
  | 'admin'
  | 'createGroup'
  | 'fileShare';

const ChatApp: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fileMessage, setFileMessage] = useState<any>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      setCurrentScreen('chatList');
      // Connect to socket when user is logged in
      socketService.connect().catch(console.error);
      
      // Request notification permissions
      NotificationService.requestPermissions();
      
      // Setup global notification listener
      socketService.on('new_message', (data) => {
        if (data.senderId !== user?.id) {
          console.log('🔔 Global notification for new message');
          NotificationService.sendLocalNotification(
            `💬 New message from ${data.senderName}`,
            data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content
          );
        }
      });
    } else if (!loading && !user) {
      setCurrentScreen('login');
    }
  }, [user, loading]);

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setCurrentScreen('chat');
  };

  const handleUserSelect = async (user: User) => {
    try {
      // Create or get personal chat with selected user
      const response = await fetch('http://192.168.100.191:3000/api/chats/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const chat = await response.json();
        setSelectedChat(chat);
        setCurrentScreen('chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const renderScreen = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#667eea' }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      );
    }

    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen onNavigateToRegister={() => setCurrentScreen('register')} />
        );
      
      case 'register':
        return (
          <RegisterScreen onNavigateToLogin={() => setCurrentScreen('login')} />
        );
      
      case 'chatList':
        return (
          <ChatListScreen
            onChatSelect={handleChatSelect}
            onNavigateToUsers={() => setCurrentScreen('users')}
            onNavigateToAdmin={() => setCurrentScreen('admin')}
            onNavigateToCreateGroup={() => setCurrentScreen('createGroup')}
          />
        );
      
      case 'chat':
        return selectedChat ? (
          <ChatScreen
            chat={selectedChat}
            onBack={() => setCurrentScreen('chatList')}
            onNavigateToFileShare={() => setCurrentScreen('fileShare')}
            fileMessage={fileMessage}
            onFileMessageHandled={() => setFileMessage(null)}
          />
        ) : null;
      
      case 'users':
        return (
          <UsersScreen
            onUserSelect={handleUserSelect}
            onBack={() => setCurrentScreen('chatList')}
          />
        );
      
      case 'admin':
        return (
          <AdminScreen onBack={() => setCurrentScreen('chatList')} />
        );
      
      case 'createGroup':
        return (
          <CreateGroupScreen
            onGroupCreated={(group) => {
              setSelectedChat(group);
              setCurrentScreen('chat');
            }}
            onBack={() => setCurrentScreen('chatList')}
          />
        );
      
      case 'fileShare':
        return selectedChat ? (
          <FileShareScreen
            chatId={selectedChat.id}
            onFileSent={(file) => {
              // Store the file message to pass to ChatScreen
              setFileMessage(file);
              setCurrentScreen('chat');
            }}
            onBack={() => setCurrentScreen('chat')}
          />
        ) : null;
      
      default:
        return (
          <LoginScreen onNavigateToRegister={() => setCurrentScreen('register')} />
        );
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      {renderScreen()}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatApp />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
