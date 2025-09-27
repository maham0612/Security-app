import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileContainer from '../MobileContainer';

const onboarding2Image = require('../../assets/delivery.png');
const logoImage = require('../../assets/imageLogo.png');

interface OnboardingTwoProps {
  onNext?: () => void;
  onBack?: () => void;
}

const OnboardingTwo = ({ onNext, onBack }: OnboardingTwoProps) => {
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
        <View style={styles.header}>
          <View style={[styles.logoContainer, { opacity: isVisible ? 1 : 0 }]}>
            <Image 
              source={logoImage} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.content}
          onPress={onNext}
          activeOpacity={0.9}
        >
          <View style={[styles.imageContainer, { opacity: isVisible ? 1 : 0 }]}>
            <Image
              source={onboarding2Image}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>
                Fresh, Hot & At Your{'\n'}Door Steps
              </Text>
              <Text style={styles.description}>
                From our grill to your door — faster than{'\n'}your hunger can grow.
              </Text>
            </View>
            
            <View style={styles.dotsContainer}>
              <View style={styles.dot}></View>
              <View style={[styles.dot, styles.activeDot]}></View>
            </View>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  logoContainer: {
    position: 'absolute',
    top: 75,
    left: '50%',
    marginLeft: -90.5, // Half of logo width (181/2)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 181,
    height: 30,
    resizeMode: 'contain',
    opacity: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 450,
    height: 'auto',
    minHeight: 300,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: '100%',
    maxWidth: 400,
    height: 320,
    opacity: 1,
    flex: 1,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20, // Moved text up
  },
  title: {
    fontFamily: 'Gabarito',
    fontWeight: '700',
    fontStyle: 'normal',
    fontSize: 30,
    lineHeight: 30, // 100% of 30px
    letterSpacing: -0.6, // -2% of 30px
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 16,
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
    maxWidth: 300,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5, // Moved dots up
    gap: 6,
  },
  dot: {
    width: 12, // Increased size
    height: 12, // Increased size
    borderRadius: 6, // Adjusted for larger size
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#F95233',
  },
});

export default OnboardingTwo;
