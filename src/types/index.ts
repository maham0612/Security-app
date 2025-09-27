export interface Chat {
  id: string;
  name: string;
  type: 'personal' | 'group';
  participants: string[];
  isEncrypted: boolean;
  settings: {
    allowCopy: boolean;
    allowShare: boolean;
    allowDelete: boolean;
    allowScreenshot: boolean;
  };
  lastMessage?: {
    content: string;
    timestamp: string;
    senderName: string;
  };
  lastMessageTime: string;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  isAdmin: boolean;
}
