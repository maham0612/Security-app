import * as React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

const styles = StyleSheet.create({
  input: {
    height: 40,
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
  },
});

export { Input };
