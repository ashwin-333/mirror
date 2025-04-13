import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { performSkinAnalysis, SkinAnalysisResult, Recommendations, checkServerHealth } from '../../utils/skinAnalysis';
import { performHairAnalysis, HairAnalysisResult, HairRecommendations, HairInfo } from '../../utils/hairAnalysis';
import { Svg, Path, G, ClipPath, Defs, Circle, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type LoadingScreenProps = {
  navigation: any;
  route: {
    params: {
      mode: 'face' | 'hair';
      photoUri?: string;
      hairInfo?: HairInfo;
    };
  };
};

export const LoadingScreen = ({ navigation, route }: LoadingScreenProps) => {
  const { mode, photoUri, hairInfo } = route.params;
  const spinAnimation = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("Starting analysis...");

  useEffect(() => {
    // Start the spinner animation
    Animated.loop(
      Animated.timing(spinAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Process based on mode
    if (mode === 'face') {
      processFacePhoto();
    } else if (mode === 'hair') {
      processHairPhoto();
    }

    // Clean up animation
    return () => {
      spinAnimation.stopAnimation();
    };
  }, [navigation, mode, photoUri, spinAnimation]);

  // Process face/skin photo
  const processFacePhoto = async () => {
    if (photoUri) {
      try {
        // Check if the file exists
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (!fileInfo.exists) {
          throw new Error('Photo file not found');
        }
        
        // Check server health before processing
        setProgress("Checking background removal service...");
        await checkServerHealth();
        
        // Perform skin analysis using our utility
        setProgress("Analyzing skin features...");
        const results = await performSkinAnalysis(photoUri);
        
        // Navigate to results screen with analysis data
        setProgress("Loading results...");
        navigation.navigate('Results', { 
          mode,
          analysis: results.analysis,
          recommendations: results.recommendations
        });
      } catch (err) {
        console.error('Error analyzing skin photo:', err);
        setError('Something went wrong with skin analysis. Please try again.');
        setProgress("Using fallback recommendations...");
        
        // Navigate to results with fallback data after a delay
        setTimeout(() => {
          navigation.navigate('Results', { mode });
        }, 2000);
      }
    } else {
      // If no photo, wait a moment and navigate to results with default data
      setProgress("No photo provided, using default data...");
      setTimeout(() => {
        navigation.navigate('Results', { mode });
      }, 2000);
    }
  };

  // Process hair photo
  const processHairPhoto = async () => {
    if (photoUri) {
      try {
        // Check if the file exists
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (!fileInfo.exists) {
          throw new Error('Photo file not found');
        }
        
        // Perform hair analysis
        setProgress("Processing your hair...");
        const results = await performHairAnalysis(photoUri, hairInfo || {
          dandruff: null,
          dryness: null,
          density: null
        });
        
        // Navigate to HairResults screen with analysis data
        setProgress("Loading results...");
        navigation.navigate('HairResults', { 
          analysis: results.analysis,
          recommendations: results.recommendations
        });
      } catch (err) {
        console.error('Error analyzing hair photo:', err);
        setError('Something went wrong with hair analysis. Please try again.');
        setProgress("Using fallback recommendations...");
        
        // Navigate to HairResults with fallback data after a delay
        setTimeout(() => {
          navigation.navigate('HairResults', {});
        }, 2000);
      }
    } else {
      // If no photo, wait a moment and navigate to HairResults with default data
      setProgress("No photo provided, using default data...");
      setTimeout(() => {
        navigation.navigate('HairResults', {});
      }, 2000);
    }
  };

  const spin = spinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Navigation items data
  const navigationItems = [
    { icon: require('../../../assets/home.png'), active: false, onPress: () => navigation.navigate('Home') },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/scan.png'), active: false },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/wand.png'), active: true },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/tag.png'), active: false },
  ];

  // Custom spinner component
  const TrackSpinner = ({ size = 100 }) => (
    <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <Defs>
        <LinearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <Stop offset="100%" stopColor="#CA5A5E" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle
        cx="26"
        cy="26"
        r="23"
        stroke="url(#spinnerGradient)"
        strokeWidth="4"
        fill="none"
      />
    </Svg>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Loading content */}
      <View style={styles.loadingContainer}>
        {/* Custom spinner with animation */}
        <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: scaleWidth(20) }}>
          <TrackSpinner size={scaleWidth(100)} />
        </Animated.View>
        
        {/* Loading message */}
        <Text style={styles.title}>Hang tight.</Text>
        <Text style={styles.subtitle}>Mirror AI is working its magic...</Text>
        
        {/* Progress message */}
        <Text style={styles.progressText}>{progress}</Text>
        
        {/* Error message if any */}
        {error && <Text style={styles.errorText}>{error}</Text>}
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
              onPress={item.onPress}
              disabled={!item.onPress}
            >
              <Image
                source={item.icon}
                style={[
                  styles.navIcon,
                  // The arrow icons were half the size (12x12) of the main icons (24x24)
                  index % 2 === 1 ? styles.arrowIcon : styles.mainIcon,
                ]}
                tintColor={index === 0 ? '#000000' : item.active ? '#FFFFFF' : undefined}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleWidth(20),
    paddingBottom: scaleWidth(70), // Add padding to make room for navbar
  },
  title: {
    fontSize: scaleWidth(60),
    fontWeight: 'bold',
    marginTop: scaleWidth(10),
    marginBottom: scaleWidth(10),
    textAlign: 'center',
    fontFamily: "InstrumentSans-Bold",
  },
  subtitle: {
    fontSize: scaleWidth(16),
    color: '#000',
    textAlign: 'center',
    fontFamily: "InstrumentSans-Regular",
    marginBottom: scaleWidth(20),
  },
  progressText: {
    fontSize: scaleWidth(14),
    color: '#555',
    textAlign: 'center',
    fontFamily: "InstrumentSans-Regular",
    marginBottom: scaleWidth(20),
  },
  errorText: {
    fontSize: scaleWidth(14),
    color: '#ca5a5e',
    textAlign: 'center',
    fontFamily: "InstrumentSans-Regular",
  },
  navBarContainer: {
    position: 'absolute',
    bottom: scaleWidth(30),
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: scaleWidth(8),
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    paddingVertical: scaleWidth(8),
    backgroundColor: 'white',
  },
  navItem: {
    width: scaleWidth(42),
    height: scaleWidth(42),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleWidth(21),
  },
  activeNavItem: {
    backgroundColor: '#ca5a5e',
  },
  navIcon: {
    resizeMode: 'contain',
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