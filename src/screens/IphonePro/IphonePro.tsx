import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeMainSvg } from "../../components/HomeMainSvg";
import HairBtnSvg from '../../components/HairBtnSvg';
import FaceBtnSvg from '../../components/FaceBtnSvg';
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { HomeSvg } from "../../components/HomeSvg";
import { RightArrowSvg } from "../../components/RightArrowSvg";
import { ScanSvg } from "../../components/ScanSvg";
import { WandSvg } from "../../components/WandSvg";
import { TagSvg } from "../../components/TagSvg";

// We'll use these base values to preserve the exact ratio from your iPhone design
// Adjust 393 to whatever your "base" design width is.
const BASE_WIDTH = 393;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Function to convert iPhone 16 Pro's absolute pixel dimensions to the current device's width
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

// Profile image storage key - same as in ProfileScreen
const PROFILE_IMAGE_KEY = '@profile_image';

type IphoneProProps = {
  navigation: any;
};

export const IphonePro = ({ navigation }: IphoneProProps): JSX.Element => {
  // Get user data from auth context
  const { user, checkUserStatus } = useAuth();
  
  // Get first name for display
  const firstName = user?.name?.split(' ')[0]?.toUpperCase() || 'USER';

  // State for profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Load profile image - prioritize user data from API, fall back to local storage
  const loadProfileImage = async () => {
    try {
      setLoadingImage(true);
      console.log('IphonePro: Loading profile image, user object:', JSON.stringify({
        hasUser: !!user,
        userId: user?._id,
        userName: user?.name,
        hasProfileImage: !!user?.profileImage,
        profileImageType: typeof user?.profileImage
      }));
      
      // First check if user has a profile image in their data (from server)
      if (user?.profileImage) {
        console.log('IphonePro: Using profile image from user data');
        // The image is now a complete data URL from the server
        setProfileImage(user.profileImage);
      } else {
        console.log('IphonePro: No profile image in user data, trying local storage');
        // Fall back to local storage if no server image
        const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
        if (savedImage) {
          console.log('IphonePro: Using profile image from local storage');
          setProfileImage(savedImage);
        } else {
          console.log('IphonePro: No profile image found in local storage');
        }
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    } finally {
      setLoadingImage(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    loadProfileImage();
  }, []);
  
  // Reload profile image whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Just load the profile image based on current user data
      // Don't call checkUserStatus here as it creates an infinite loop
      loadProfileImage();
      return () => {};
    }, [user]) // Add user as a dependency so it updates when user changes
  );

  // Navigation items data with SVG components
  const navigationItems = [
    { icon: 'home', active: true },
    { icon: 'arrow', active: false },
    { icon: 'scan', active: false },
    { icon: 'arrow', active: false },
    { icon: 'wand', active: false },
    { icon: 'arrow', active: false },
    { icon: 'tag', active: false },
  ];

  // Function to render the appropriate SVG component based on the icon type
  const renderNavIcon = (icon: string, isActive: boolean, index: number) => {
    // Set colors based on active state
    const iconColor = isActive ? 'white' : 'black';
    
    // Arrow icons are smaller than main icons
    const arrowSize = scaleWidth(12);
    const mainIconSize = scaleWidth(24);
    const iconSize = index % 2 === 1 ? arrowSize : mainIconSize;
    
    switch(icon) {
      case 'home':
        return <HomeSvg width={iconSize} height={iconSize} color={iconColor} />;
      case 'arrow':
        return <RightArrowSvg width={arrowSize} height={arrowSize} color={iconColor} />;
      case 'scan':
        return <ScanSvg width={iconSize} height={iconSize} color={iconColor} />;
      case 'wand':
        return <WandSvg width={iconSize} height={iconSize} color={iconColor} />;
      case 'tag':
        return <TagSvg width={iconSize} height={iconSize} color={iconColor} fillColor={iconColor} />;
      default:
        return null;
    }
  };

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
            <Text style={styles.nameText}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={handleProfilePress}>
            {loadingImage ? (
              <View style={[styles.profileImage, styles.profileImageLoading]}>
                <ActivityIndicator size="large" color="#CA5A5E" />
              </View>
            ) : (
              <Image
                source={profileImage ? { uri: profileImage } : require("../../../assets/ellipse-1.png")}
                style={styles.profileImage}
                resizeMode="cover"
              />
            )}
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
                {renderNavIcon(item.icon, item.active, index)}
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
  profileImageLoading: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: scaleWidth(10),
    width: "100%",
    alignItems: "center",
  },
  scanButton: {
    marginBottom: scaleWidth(10),
    width: "95%",
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
