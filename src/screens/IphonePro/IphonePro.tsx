import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeMainSvg } from "../../components/HomeMainSvg";
import HairBtnSvg from '../../components/HairBtnSvg';
import FaceBtnSvg from '../../components/FaceBtnSvg';

// We'll use these base values to preserve the exact ratio from your iPhone design
// Adjust 393 to whatever your "base" design width is.
const BASE_WIDTH = 393;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Function to convert iPhone 16 Pro's absolute pixel dimensions to the current device's width
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type IphoneProProps = {
  navigation: any;
};

export const IphonePro = ({ navigation }: IphoneProProps): JSX.Element => {
  // Navigation items data
  const navigationItems = [
    { icon: require("../../../assets/home.png"), active: true },
    { icon: require("../../../assets/arrow.png"), active: false },
    { icon: require("../../../assets/scan.png"), active: false },
    { icon: require("../../../assets/arrow.png"), active: false },
    { icon: require("../../../assets/wand.png"), active: false },
    { icon: require("../../../assets/arrow.png"), active: false },
    { icon: require("../../../assets/tag.png"), active: false },
  ];

  const handleScanPress = (mode: 'hair' | 'face') => {
    navigation.navigate('Camera', { mode });
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.content}>
        {/* Header with welcome message and profile picture on the same line */}
        <View style={styles.header}>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>JACOB</Text>
          </View>
          <TouchableOpacity onPress={handleProfilePress}>
            <Image
              source={require("../../../assets/ellipse-1.png")}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bodyContent}>
          {/* Main image */}
          <View style={styles.mainImageContainer}>
            {/* Adjust the SVG width/height ratio to scale dynamically. */}
            <HomeMainSvg />
          </View>

          {/* Scan buttons container */}
          <View style={styles.scanButtonsWrapper}>
            {/* Scan HAIR option */}
            <TouchableOpacity style={styles.scanButton} onPress={() => handleScanPress('hair')}>
              <HairBtnSvg />
            </TouchableOpacity>

            {/* Scan FACE option */}
            <TouchableOpacity style={styles.scanButton} onPress={() => handleScanPress('face')}>
              <FaceBtnSvg />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom navigation */}
        <View style={styles.navBarContainer}>
          <View style={styles.bottomNav}>
            {navigationItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.navItem,
                  item.active && styles.activeNavItem
                ]}
              >
                <Image
                  source={item.icon}
                  style={[
                    styles.navIcon,
                    // The arrow icons were half the size (12x12) of the main icons (24x24)
                    index % 2 === 1 ? styles.arrowIcon : styles.mainIcon
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),  // was 20
    paddingTop: scaleWidth(10),         // was 10
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: scaleWidth(15),
    marginBottom: scaleWidth(10),
    width: "100%",
  },
  welcomeTextContainer: {
    flex: 1,
  },
  profileImage: {
    width: scaleWidth(48),
    height: scaleWidth(48),
    borderRadius: scaleWidth(48) / 2,
  },
  bodyContent: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  welcomeText: {
    fontWeight: "normal",
    fontSize: scaleWidth(18),
    fontFamily: "InstrumentSans-Regular",
    letterSpacing: -1,
  },
  nameText: {
    fontWeight: "bold",
    fontSize: scaleWidth(52),
    lineHeight: scaleWidth(55),
    fontFamily: "InstrumentSans-Bold",
    letterSpacing: -1,
  },
  mainImageContainer: {
    width: "100%",
    alignItems: "center",
    height: SCREEN_HEIGHT * 0.22,
    marginTop: scaleWidth(10),
    marginBottom: scaleWidth(227),
  },
  scanButtonsWrapper: {
    width: "100%",
    alignItems: "center",
  },
  scanButton: {
    marginBottom: scaleWidth(0),
    width: "98%",
  },
  scanButtonImage: {
    width: "100%",
    height: scaleWidth(80),
    borderRadius: scaleWidth(20),
  },
  navBarContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleWidth(10),
    marginBottom: scaleWidth(-10),
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: scaleWidth(8),
    width: "90%",
    backgroundColor: "white",
  },
  navItem: {
    width: scaleWidth(42),
    height: scaleWidth(42),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleWidth(21),
  },
  activeNavItem: {
    backgroundColor: "#ca5a5e",
  },
  navIcon: {
    resizeMode: "contain",
  },
  mainIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
  },
  arrowIcon: {
    width: scaleWidth(12),
    height: scaleWidth(12),
  },
});
