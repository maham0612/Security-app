import * as React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, style, ...props }, ref) => {
    const getButtonClasses = () => {
      const baseClasses = "flex-row items-center justify-center rounded-md";
      
      const variantClasses = {
        default: "bg-brand-orange",
        destructive: "bg-red-500",
        outline: "bg-transparent border border-brand-orange",
        secondary: "bg-gray-100",
        ghost: "bg-transparent",
        link: "bg-transparent",
      };
      
      const sizeClasses = {
        sm: "h-9 px-3",
        default: "h-10 px-4",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      };
      
      return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;
    };

    const getTextClasses = () => {
      const baseClasses = "font-medium";
      
      const variantClasses = {
        default: "text-white",
        destructive: "text-white",
        outline: "text-brand-orange",
        secondary: "text-gray-700",
        ghost: "text-gray-700",
        link: "text-brand-orange underline",
      };
      
      const sizeClasses = {
        sm: "text-sm",
        default: "text-base",
        lg: "text-base",
        icon: "text-base",
      };
      
      return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
    };

    return (
      <TouchableOpacity
        ref={ref}
        className={getButtonClasses()}
        style={style}
        {...props}
      >
        <Text className={getTextClasses()}>{children}</Text>
      </TouchableOpacity>
    );
  },
);
Button.displayName = "Button";


export { Button };
