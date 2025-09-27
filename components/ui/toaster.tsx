import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Toast } from "./toast";

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToasterProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ toasts, onRemove }) => {
  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={() => onRemove(toast.id)}
          visible={true}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
});

export { Toaster };
