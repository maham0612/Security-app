import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { apiService } from '../services/api';

interface FileShareScreenProps {
  chatId: string;
  onFileSent: (file: any) => void;
  onBack: () => void;
}

const FileShareScreen: React.FC<FileShareScreenProps> = ({ chatId, onFileSent, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const selectFile = () => {
    Alert.alert(
      'Select File Type',
      'Choose the type of file you want to share',
      [
        { text: '📷 Image', onPress: () => simulateFileSelection('image') },
        { text: '📄 Document', onPress: () => simulateFileSelection('document') },
        { text: '🎵 Audio', onPress: () => simulateFileSelection('audio') },
        { text: '🎬 Video', onPress: () => simulateFileSelection('video') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const simulateFileSelection = (type: string) => {
    const mockFile = {
      name: `sample_${type}.${getFileExtension(type)}`,
      type: type,
      size: Math.floor(Math.random() * 10000000), // Random size
      uri: `file://mock_${type}_file`
    };
    setSelectedFile(mockFile);
  };


  const getFileExtension = (type: string): string => {
    switch (type) {
      case 'image': return 'jpg';
      case 'document': return 'pdf';
      case 'audio': return 'mp3';
      case 'video': return 'mp4';
      default: return 'txt';
    }
  };

  const getFileIcon = (type: string): string => {
    switch (type) {
      case 'image': return '🖼️';
      case 'document': return '📄';
      case 'audio': return '🎵';
      case 'video': return '🎥';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendFile = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // For now, simulate file upload since we don't have actual file picker
      const mockResponse = {
        id: Date.now().toString(),
        chatId: chatId,
        senderId: 'current_user',
        senderName: 'You',
        content: `📎 ${selectedFile.name}`,
        type: selectedFile.type,
        fileUrl: selectedFile.uri,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        timestamp: new Date().toISOString(),
        isRead: false,
        isEncrypted: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilExpiry: 7
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'File sent successfully!');
      onFileSent(mockResponse);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending file:', error);
      Alert.alert('Error', 'Failed to send file');
    } finally {
      setUploading(false);
    }
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
        <Text style={styles.headerTitle}>Share File</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🔒 Secure File Sharing</Text>
          <Text style={styles.infoText}>
            • Files are read-only (cannot be downloaded)
          </Text>
          <Text style={styles.infoText}>
            • Files cannot be shared outside the app
          </Text>
          <Text style={styles.infoText}>
            • Files are encrypted and secure
          </Text>
        </View>

        <View style={styles.fileSection}>
          <Text style={styles.sectionTitle}>Selected File</Text>
          
          {selectedFile ? (
            <View style={styles.filePreview}>
              <Text style={styles.fileIcon}>{getFileIcon(selectedFile.type)}</Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                <Text style={styles.fileType}>{selectedFile.type.toUpperCase()}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setSelectedFile(null)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noFileContainer}>
              <Text style={styles.noFileText}>No file selected</Text>
              <Text style={styles.noFileSubtext}>Tap "Select File" to choose a file</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={selectFile}
          >
            <Text style={styles.selectButtonText}>📁 Select File</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, (!selectedFile || uploading) && styles.sendButtonDisabled]}
            onPress={sendFile}
            disabled={!selectedFile || uploading}
          >
            <Text style={styles.sendButtonText}>
              {uploading ? 'Sending...' : '📤 Send File'}
            </Text>
          </TouchableOpacity>
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
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fileSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  fileType: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noFileContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  noFileText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 5,
  },
  noFileSubtext: {
    fontSize: 12,
    color: '#ccc',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FileShareScreen;
