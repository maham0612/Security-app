import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  isAdmin: boolean;
}

interface CreateGroupScreenProps {
  onGroupCreated: (group: any) => void;
  onBack: () => void;
}

const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ onGroupCreated, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const userData = await apiService.get<User[]>('/users');
      const otherUsers = userData.filter(u => u.id !== user?.id);
      setUsers(otherUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter group name');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setLoading(true);
    try {
      const group = await apiService.post('/chats/group', {
        name: groupName.trim(),
        participants: selectedUsers
      });

      Alert.alert('Success', 'Group created successfully!');
      onGroupCreated(group);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const getAnonymousName = (originalName: string) => {
    const hash = originalName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `Anonymous User ${Math.abs(hash) % 10000}`;
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => toggleUserSelection(item.id)}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>👤</Text>
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.userContent}>
          <Text style={styles.userName}>
            {isAdmin ? item.name : getAnonymousName(item.name)}
          </Text>
          <Text style={styles.userStatus}>
            {item.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.groupNameContainer}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.groupNameInput}
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Enter group name"
            placeholderTextColor="#999"
            maxLength={50}
          />
        </View>

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Select Members ({selectedUsers.length} selected)
          </Text>
          
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            style={styles.usersList}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={createGroup}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Group'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
  },
  groupNameContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  membersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  usersList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedUserItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarText: {
    fontSize: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  userContent: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateGroupScreen;
