import * as React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  visible?: boolean;
  onPress?: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, visible = false, onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
      {visible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{content}</Text>
        </View>
      )}
    </View>
  );
};

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.provider}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  provider: {
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});

export { Tooltip, TooltipProvider };
