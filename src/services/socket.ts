import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    this.socket = io('http://192.168.100.191:3000', {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }


  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      const listeners = this.listeners.get(event) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }

    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }


  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Chat-specific methods
  joinChat(chatId: string): void {
    this.emit('join_chat', { chatId });
  }

  leaveChat(chatId: string): void {
    this.emit('leave_chat', { chatId });
  }

  sendMessage(chatId: string, content: string, type: string = 'text'): void {
    this.emit('send_message', {
      chatId,
      content,
      type,
    });
  }

  startTyping(chatId: string): void {
    this.emit('typing_start', { chatId });
  }

  stopTyping(chatId: string): void {
    this.emit('typing_stop', { chatId });
  }

  markAsRead(messageId: string): void {
    this.emit('mark_read', { messageId });
  }

  // Admin methods
  toggleRegistration(enabled: boolean): void {
    this.emit('admin_toggle_registration', { enabled });
  }

  addAdmin(userId: string): void {
    this.emit('admin_add_admin', { userId });
  }

  removeAdmin(userId: string): void {
    this.emit('admin_remove_admin', { userId });
  }
}

export const socketService = new SocketService();
