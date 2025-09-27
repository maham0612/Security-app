import { useEffect, useState } from "react";
import { Image, View } from "react-native";
import MobileContainer from "../MobileContainer";

// Use PNG instead of SVG for now
const logoImage = require("../../assets/logo.png");

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Simple fade in effect without reanimated
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MobileContainer>
      <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F95233', paddingHorizontal: 24, paddingVertical: 32 }}>
        <View style={{ alignItems: 'center' }}>
          <View 
            style={{
              width: 265,
              height: 74,
              gap: 12,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              opacity: isVisible ? 1 : 0,
            }}
          >
            <Image
              source={logoImage}
              style={{ width: 265, height: 74 }}
              resizeMode="contain"
              fadeDuration={0}
              shouldRasterizeIOS={true}
              renderToHardwareTextureAndroid={true}
            />
          </View>
        </View>
      </View>
    </MobileContainer>
  );
};


export default SplashScreen;
