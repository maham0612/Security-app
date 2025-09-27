import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileContainer from '../MobileContainer';

// Import images
const shawarmaWrap = require('../../assets/OBJECTS.png');
const logoImage = require('../../assets/imageLogo.png');

interface WelcomeScreenProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
  onBack?: () => void;
  onNext?: () => void;
}

const WelcomeScreen = ({ onSignIn, onCreateAccount, onBack, onNext }: WelcomeScreenProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simple fade in effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MobileContainer>
      <View style={styles.container}>
        <View style={[styles.content, { opacity: isVisible ? 1 : 0 }]}>
          <View style={[styles.logoContainer, { opacity: isVisible ? 1 : 0 }]}>
            <Image 
              source={logoImage} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
            
            <View style={styles.imageContainer}>
              <Image 
                source={shawarmaWrap} 
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                Join Us, Taste Happiness!
              </Text>
              <Text style={styles.description}>
                From our grill to your door — faster than{'\n'}your hunger can grow.
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={onSignIn}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={onCreateAccount}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryButtonText}>Create account</Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  logoContainer: {
    position: 'absolute',
    top: 80,
    left: '50%',
    marginLeft: -90.5, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 30,
    resizeMode: 'contain',
    opacity: 1,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 300,
    height: 190,
    marginBottom: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    marginTop: 140,
  },
  image: {
    width: 270,
    height: 290,
    opacity: 1,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
    marginTop: 30,
  },
  title: {
    fontFamily: 'Gabarito',
    fontWeight: '700',
    fontStyle: 'normal',
    fontSize: 28,
    lineHeight: 30, // 100% of 30px
    letterSpacing: -0.6, // -2% of 30px
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 12,
    flexWrap: 'nowrap',
  },
  description: {
    fontFamily: 'Gabarito',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#6B7280',
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 380,
    paddingHorizontal: 2,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#F95233',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F95233',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#F95233',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
