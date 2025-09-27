import * as React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
  visible?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'default',
  onClose,
  visible = true,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.toast, styles[variant]]}>
        <View style={styles.content}>
          {title && <Text style={[styles.title, styles[`${variant}Title`]]}>{title}</Text>}
          {description && <Text style={[styles.description, styles[`${variant}Description`]]}>{description}</Text>}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.9,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  // Variants
  default: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  destructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  // Text variants
  defaultTitle: {
    color: '#111827',
  },
  destructiveTitle: {
    color: '#DC2626',
  },
  defaultDescription: {
    color: '#6B7280',
  },
  destructiveDescription: {
    color: '#DC2626',
  },
});

export { Toast };
