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
import FilePicker from 'react-native-file-picker';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FileShareScreenProps {
  chatId: string;
  onFileSent: (file: any) => void;
  onBack: () => void;
}

const FileShareScreen: React.FC<FileShareScreenProps> = ({ chatId, onFileSent, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const selectFile = () => {
    Alert.alert(
      'Select File Type',
      'Choose the type of file you want to share',
      [
        { text: '📷 Image', onPress: () => selectImage() },
        { text: '📄 Document', onPress: () => selectDocument() },
        { text: '🎵 Audio', onPress: () => selectAudio() },
        { text: '🎬 Video', onPress: () => selectVideo() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image',
          size: asset.fileSize || 0,
          uri: asset.uri || '',
          width: asset.width,
          height: asset.height,
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const selectDocument = async () => {
    try {
      FilePicker.showFilePicker({
        title: 'Select Document',
      }, (response) => {
        if (response.didCancel || response.error) {
          return;
        }
        
        if (response.uri) {
          setSelectedFile({
            name: response.fileName || 'document',
            type: 'document',
            size: 0, // File size not available in this library
            uri: response.uri,
            mimeType: response.type,
          });
        }
      });
    } catch (error) {
      console.error('Error selecting document:', error);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const selectAudio = async () => {
    try {
      FilePicker.showFilePicker({
        title: 'Select Audio',
      }, (response) => {
        if (response.didCancel || response.error) {
          return;
        }
        
        if (response.uri) {
          setSelectedFile({
            name: response.fileName || 'audio',
            type: 'audio',
            size: 0, // File size not available in this library
            uri: response.uri,
            mimeType: response.type,
          });
        }
      });
    } catch (error) {
      console.error('Error selecting audio:', error);
      Alert.alert('Error', 'Failed to select audio');
    }
  };

  const selectVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video' as MediaType,
        quality: 0.8,
        includeBase64: false,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          name: asset.fileName || `video_${Date.now()}.mp4`,
          type: 'video',
          size: asset.fileSize || 0,
          uri: asset.uri || '',
          duration: asset.duration,
        });
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video');
    }
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
      // First upload the file to backend
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: getMimeType(selectedFile.type),
        name: selectedFile.name,
      } as any);

      console.log('📤 Uploading file to backend...');
      const uploadResponse = await fetch('http://192.168.100.191:3000/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('📤 File uploaded successfully:', uploadResult);

      // Now send the message with file info
      const messageResponse = await fetch(`http://192.168.100.191:3000/api/messages/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          content: `📎 ${selectedFile.name}`,
          type: selectedFile.type === 'document' ? 'file' : selectedFile.type,
          fileUrl: uploadResult.url,
          fileName: uploadResult.originalName,
          fileSize: uploadResult.size,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }

      const message = await messageResponse.json();
      console.log('📨 Message sent successfully:', message);

      // Call the callback to add message to chat
      onFileSent(message);
      setSelectedFile(null);
      
      Alert.alert('Success', 'File sent successfully!');
    } catch (error) {
      console.error('Error sending file:', error);
      Alert.alert('Error', 'Failed to send file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const getMimeType = (type: string): string => {
    switch (type) {
      case 'image': return 'image/jpeg';
      case 'document': return 'application/pdf';
      case 'audio': return 'audio/mpeg';
      case 'video': return 'video/mp4';
      default: return 'application/octet-stream';
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
