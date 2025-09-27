import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MobileContainer from '../MobileContainer';

// Import logo and social icons
const logoImage = require('../../assets/imageLogo.png');
const facebookIcon = require('../../assets/icons/Facebook.png');
const googleIcon = require('../../assets/icons/Google.png');
const viewIcon = require('../../assets/icons/view.png');

interface RegistrationScreenProps {
  onBack: () => void;
  onSignUp: (data: { name: string; email: string; password: string }) => void;
}

const RegistrationScreen = ({ onBack, onSignUp }: RegistrationScreenProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = () => {
    onSignUp(formData);
  };

  return (
    <MobileContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image 
              source={logoImage} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.placeholder}></View>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              ✨ Create Your Account
            </Text>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                activeOpacity={0.7}
                onPressIn={() => setIsPasswordVisible(true)}
                onPressOut={() => setIsPasswordVisible(false)}
              >
                <Image source={viewIcon} style={styles.eyeIconImage} resizeMode="contain" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSubmit}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>Or</Text>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>Continue with phone number</Text>
            </TouchableOpacity>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.9}>
                <Image source={facebookIcon} style={styles.socialIcon} resizeMode="contain" />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.9}>
                <Image source={googleIcon} style={styles.socialIcon} resizeMode="contain" />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink} onPress={onBack}>
                  Log In
                </Text>
              </Text>
            </View>
          </View>
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
  logoContainer: {
    position: 'absolute',
    top: 75,
    left: '50%',
    marginLeft: -80, // shift slightly to the right
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 181,
    height: 30,
    resizeMode: 'contain',
    opacity: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  titleContainer: {
    marginBottom: 12, // closer to the form
    marginTop: 40, // a bit more gap below the logo
  },
  title: {
    fontFamily: 'Poppins',
    fontWeight: '700',
    fontStyle: 'normal',
    fontSize: 28,
    // lineHeight: 33.6, 
    letterSpacing: -0.56, 
    color: '#1F2937',
    // marginBottom: 4,
  },
  form: {
    gap: 12,
    marginTop: 8, // nudge content slightly downward
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 44, // leave space for eye icon
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  eyeIconImage: {
    width: 20,
    height: 20,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 343,
    height: 48,
    backgroundColor: '#F95233',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    alignSelf: 'center',
    opacity: 1,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  orText: {
    width: '90%',
    maxWidth: 336,
    height: 18,
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 10,
    alignSelf: 'center',
    opacity: 1,
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 343,
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F95233',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    opacity: 1,
  },
  secondaryButtonText: {
    color: '#F95233',
    fontSize: 16,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  socialButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 26,
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600', // make slightly bolder
  },
  loginLink: {
    color: '#F95233',
    fontWeight: '500',
  },
});

export default RegistrationScreen;
