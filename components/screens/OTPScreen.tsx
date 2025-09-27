import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MobileContainer from '../MobileContainer';

interface OTPScreenProps {
  onBack: () => void;
  onVerify: (code: string) => void;
  email?: string;
  hasError?: boolean;
  errorMessage?: string;
}

const OTPScreen = ({ onBack, onVerify, email = "sample@example.com", hasError = false, errorMessage = "Wrong code, please try again" }: OTPScreenProps) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timer, setTimer] = useState(20);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };


  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 4) {
      onVerify(code);
    }
  };

  const isComplete = otp.every(digit => digit !== '');
  const formatTime = (seconds: number) => `00:${seconds.toString().padStart(2, '0')}`;

  return (
    <MobileContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brandTitle}>
            Shawarma Stop
          </Text>
          <View style={styles.placeholder}></View>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Enter code
            </Text>
            <Text style={styles.subtitle}>
              We've sent an SMS with an activation code to your email {email}
            </Text>
          </View>
          
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={el => inputRefs.current[index] = el}
                style={[
                  styles.otpInput,
                  digit ? styles.filledInput : null,
                  hasError ? styles.errorInput : null,
                  focusedIndex === index ? styles.focusedInput : null,
                ]}
                value={digit}
                onChangeText={(text) => handleOTPChange(index, text)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(prev => (prev === index ? null : prev))}
              />
            ))}
          </View>
          
          {hasError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          )}
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              Send code again{' '}
              <Text style={[styles.timerSpan, timer === 0 ? styles.resendText : styles.timerText]}>
                {formatTime(timer)} {timer === 0 ? 'Resend' : ''}
              </Text>
            </Text>
          </View>
          
          {isComplete && (
            <TouchableOpacity 
              style={styles.verifyButton}
              onPress={handleVerify}
              activeOpacity={0.9}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        
      </View>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#1F2937',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F95233',
    fontFamily: 'Dancing Script',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  focusedInput: {
    borderColor: '#F95233',
    backgroundColor: '#FFF8F5',
  },
  filledInput: {
    borderColor: '#F95233',
    backgroundColor: '#FFF8F5',
  },
  errorInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timerSpan: {
    color: '#6B7280',
  },
  resendText: {
    color: '#F95233',
  },
  verifyButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#F95233',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OTPScreen;
