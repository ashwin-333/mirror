import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { performSkinAnalysis, SkinAnalysisResult, Recommendations } from '../../utils/skinAnalysis';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type LoadingScreenProps = {
  navigation: any;
  route: {
    params: {
      mode: 'face' | 'hair';
      photoUri?: string;
    };
  };
};

export const LoadingScreen = ({ navigation, route }: LoadingScreenProps) => {
  const { mode, photoUri } = route.params;
  const spinAnimation = useRef(new Animated.Value(0)).current;
  const [status, setStatus] = useState('Analyzing your skin...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Start the spinner animation
    Animated.loop(
      Animated.timing(spinAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Process the photo if it exists
    const processPhoto = async () => {
      if (photoUri) {
        try {
          setStatus('Analyzing your skin...');
          
          // Check if the file exists
          const fileInfo = await FileSystem.getInfoAsync(photoUri);
          if (!fileInfo.exists) {
            throw new Error('Photo file not found');
          }
          
          setStatus('Finding the best products for you...');
          
          // Perform skin analysis using our utility
          const results = await performSkinAnalysis(photoUri);
          
          // Wait a moment for a better UX
          setTimeout(() => {
            // Navigate to results screen with analysis data
            navigation.navigate('Results', { 
              mode,
              analysis: results.analysis,
              recommendations: results.recommendations
            });
          }, 1000);
        } catch (err) {
          console.error('Error analyzing photo:', err);
          setError('Something went wrong with skin analysis. Please try again.');
          // Navigate to results with fallback data after a delay
          setTimeout(() => {
            navigation.navigate('Results', { mode });
          }, 2000);
        }
      } else {
        // If no photo, wait a moment and navigate to results with default data
        setTimeout(() => {
          navigation.navigate('Results', { mode });
        }, 3000);
      }
    };

    processPhoto();

    // Clean up animation
    return () => {
      spinAnimation.stopAnimation();
    };
  }, [navigation, mode, photoUri, spinAnimation]);

  const spin = spinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Loading content */}
      <View style={styles.loadingContainer}>
        {/* Simple loading spinner */}
        <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]}>
        </Animated.View>
        
        {/* Loading message */}
        <Text style={styles.title}>Hang tight.</Text>
        <Text style={styles.subtitle}>Mirror AI is working its magic...</Text>
        
        {/* Status message */}
        <Text style={styles.statusText}>{status}</Text>
        
        {/* Error message if any */}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      
      {/* Bottom navigation */}
      <View style={styles.navBarContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Image 
              source={require('../../../assets/home.png')}
              style={styles.navIcon}
              resizeMode="contain"
              tintColor="#000"
            />
          </TouchableOpacity>
          
          <Text style={styles.navArrow}>{'>'}</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Image 
              source={require('../../../assets/scan.png')}
              style={styles.navIcon}
              resizeMode="contain"
              tintColor="#000"
            />
          </TouchableOpacity>
          
          <Text style={styles.navArrow}>{'>'}</Text>
          
          <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
            <Image 
              source={require('../../../assets/wand.png')}
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <Text style={styles.navArrow}>{'>'}</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Image 
              source={require('../../../assets/tag.png')}
              style={styles.navIcon}
              resizeMode="contain"
              tintColor="#000"
            />
          </TouchableOpacity>
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
  },
  loadingSpinner: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(35),
    borderWidth: 4,
    borderColor: '#ca5a5e',
    borderTopColor: 'transparent',
    marginBottom: scaleWidth(15),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    marginBottom: scaleWidth(40),
  },
  statusText: {
    fontSize: scaleWidth(14),
    color: '#777',
    textAlign: 'center',
    fontFamily: "InstrumentSans-Regular",
    marginBottom: scaleWidth(8),
  },
  errorText: {
    fontSize: scaleWidth(14),
    color: '#ca5a5e',
    textAlign: 'center',
    fontFamily: "InstrumentSans-Regular",
  },
  navBarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleWidth(10),
    backgroundColor: 'white',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    paddingVertical: scaleWidth(8),
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
    width: scaleWidth(24),
    height: scaleWidth(24),
  },
  navArrow: {
    fontSize: scaleWidth(14),
    color: '#888',
  },
}); 