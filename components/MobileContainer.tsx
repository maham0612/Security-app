import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface MobileContainerProps {
  children: ReactNode;
  showStatusBar?: boolean;
}

const MobileContainer = ({ children, showStatusBar = false }: MobileContainerProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
  },
});

export default MobileContainer;
