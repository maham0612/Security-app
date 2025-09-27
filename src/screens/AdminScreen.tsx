import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Switch,
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
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  adminUsers: number;
  todayUsers: number;
  registrationEnabled: boolean;
}

const AdminScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        apiService.get<User[]>('/admin/users'),
        apiService.get<AdminStats>('/admin/stats'),
      ]);
      
      setUsers(usersData);
      setStats(statsData);
      setRegistrationEnabled(statsData.registrationEnabled);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleRegistration = async (enabled: boolean) => {
    try {
      if (enabled) {
        await apiService.post('/admin/registration/enable');
      } else {
        await apiService.post('/admin/registration/disable');
      }
      setRegistrationEnabled(enabled);
      Alert.alert('Success', `Registration ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling registration:', error);
      Alert.alert('Error', 'Failed to update registration settings');
    }
  };

  const toggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    try {
      if (isAdmin) {
        await apiService.delete(`/admin/users/${userId}`);
        Alert.alert('Success', 'Admin privileges removed');
      } else {
        await apiService.post('/admin/users', { userId });
        Alert.alert('Success', 'User added as admin');
      }
      loadData(); // Reload data
    } catch (error) {
      console.error('Error toggling admin status:', error);
      Alert.alert('Error', 'Failed to update admin status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>👤</Text>
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userDate}>Joined: {formatDate(item.createdAt)}</Text>
        </View>
      </View>
      
      <View style={styles.userActions}>
        <View style={styles.adminToggle}>
          <Text style={styles.adminLabel}>Admin</Text>
          <Switch
            value={item.isAdmin}
            onValueChange={(value) => toggleAdminStatus(item.id, !value)}
            disabled={item.id === user?.id} // Can't remove yourself
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.isAdmin ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  const renderStatsCard = (title: string, value: number, color: string) => (
    <View style={[styles.statsCard, { backgroundColor: color }]}>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Stats Section */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              {renderStatsCard('Total Users', stats.totalUsers, '#4CAF50')}
              {renderStatsCard('Online Now', stats.onlineUsers, '#2196F3')}
              {renderStatsCard('Admins', stats.adminUsers, '#FF9800')}
              {renderStatsCard('Today', stats.todayUsers, '#9C27B0')}
            </View>
          </View>
        )}

        {/* Registration Control */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Registration Control</Text>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Allow New Registrations</Text>
            <Switch
              value={registrationEnabled}
              onValueChange={toggleRegistration}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={registrationEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>User Management</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="white"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        </View>
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
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statsTitle: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  controlSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  controlLabel: {
    fontSize: 16,
    color: '#333',
  },
  usersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  userActions: {
    alignItems: 'center',
  },
  adminToggle: {
    alignItems: 'center',
  },
  adminLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AdminScreen;
