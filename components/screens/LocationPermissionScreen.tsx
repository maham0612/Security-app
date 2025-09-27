import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MobileContainer from "../MobileContainer";

// Import images
const deliveryLocation = require("../../assets/deliveryLocation.png");
const building1Icon = require("../../assets/icons/building1.png");
const building2Icon = require("../../assets/icons/building2.png");

interface LocationPermissionScreenProps {
  onContinue: () => void;
}

const LocationPermissionScreen = ({
  onContinue,
}: LocationPermissionScreenProps) => {
  return (
    <MobileContainer>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={deliveryLocation}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Please allow location{"\n"}access to proceed
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Image
                  source={building1Icon}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureDescription}>
                  Discovering the best restaurants and shops{"\n"}near you,
                  handpicked for your needs.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Image
                  source={building2Icon}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureDescription}>
                  Fast, on-time, and accurate delivery
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MobileContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    // paddingHorizontal: 20,
    // paddingVertical: 20,
  },
  imageContainer: {
    width: "100%",
    maxWidth: 350,
    height: 250,
    marginTop: 100,
    // marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  image: {
    width: 280,
    height: 220,
    resizeMode: "contain",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 20,
    // paddingHorizontal: 10,
    paddingRight: 10,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: "Gabarito",
    fontWeight: "700",
    fontStyle: "normal",
    fontSize: 30,
    lineHeight: 32,
    // letterSpacing: -0.3,
    color: "#1F2937",
    // textAlign: "center",
    marginBottom: 22,
    maxWidth: "100%",
    paddingHorizontal: 8,
  },
  featuresContainer: {
    gap: 14,
    alignSelf: "stretch",
    maxWidth: "100%",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  featureIcon: {
    width: 32,
    height: 32,
    backgroundColor: "rgba(249, 82, 51, 0.1)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  featureText: {
    flex: 1,
  },
  featureDescription: {
    fontWeight: "600",
    fontStyle: "normal",
    fontSize: 13,
    lineHeight: 22,
    letterSpacing: 0,
    color: "#1F2937",
    textAlign: "left",
    marginTop: 6,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 350,
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 10,
  },
  continueButton: {
    width: "100%",
    height: 48,
    backgroundColor: "#F95233",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default LocationPermissionScreen;
