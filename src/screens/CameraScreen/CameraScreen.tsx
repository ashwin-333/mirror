import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type CameraScreenProps = {
  navigation: any;
  route: {
    params: {
      mode: 'face' | 'hair';
    };
  };
};

export const CameraScreen = ({ navigation, route }: CameraScreenProps) => {
  const { mode } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Use regular ref for CameraView
  const cameraRef = useRef<any>(null);
  
  // Define camera facing
  const cameraFacing = mode === 'face' ? 'front' : 'back';

  useEffect(() => {
    (async () => {
      // Request permissions using the hook
      await requestPermission();
      if (permission) {
        setHasPermission(permission.status === 'granted');
      }
      
      // Request media library permissions
      await MediaLibrary.requestPermissionsAsync();
    })();
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        navigation.navigate('Loading', { mode, photoUri: photo.uri });
      } catch (error) {
        console.error('Error taking picture:', error);
        navigation.navigate('Loading', { mode });
      }
    } else {
      navigation.navigate('Loading', { mode });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Render loading state if permission is still pending
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render fallback if permissions are denied
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <Text style={styles.text}>No access to camera</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => navigation.navigate('Loading', { mode })}
          >
            <Text style={styles.permissionButtonText}>Continue Anyway</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.cameraContainer}>
        {hasPermission ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraFacing}
          >
            <View style={styles.overlayContainer}>
              {/* Header text */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.title}>
                  Snap a picture when you're ready!
                </Text>
                <Text style={styles.subtitle}>
                  Please make sure you're not wearing makeup{'\n'}and positioned under good lighting.
                </Text>
              </View>

              {/* Oval face guide */}
              <View style={styles.ovalFrame} />

              {/* Camera controls */}
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.galleryButton}>
                  <Image
                    source={require('../../../assets/pics.png')}
                    style={styles.galleryIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        ) : (
          // Fallback view if somehow permissions are not granted
          <View style={styles.mockCamera}>
            <View style={styles.overlayContainer}>
              <View style={styles.instructionsContainer}>
                <Text style={styles.title}>
                  Snap a picture when you're ready!
                </Text>
                <Text style={styles.subtitle}>
                  Please make sure you're not wearing makeup{'\n'}and positioned under good lighting.
                </Text>
              </View>
              <View style={styles.ovalFrame} />
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.galleryButton}>
                  <Image
                    source={require('../../../assets/pics.png')}
                    style={styles.galleryIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Bottom navigation */}
      <View style={styles.navBarContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Image
              source={require('../../../assets/home.png')}
              style={styles.navIcon}
            />
          </TouchableOpacity>
          <Text style={styles.navArrow}>{'>'}</Text>
          <View style={styles.activeNavItemContainer}>
            <Image
              source={require('../../../assets/scan.png')}
              style={styles.navIcon}
            />
          </View>
          <Text style={styles.navArrow}>{'>'}</Text>
          <TouchableOpacity>
            <Image
              source={require('../../../assets/wand.png')}
              style={styles.navIcon}
            />
          </TouchableOpacity>
          <Text style={styles.navArrow}>{'>'}</Text>
          <TouchableOpacity>
            <Image
              source={require('../../../assets/tag.png')}
              style={styles.navIcon}
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
    backgroundColor: 'black',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#CA5A5E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  mockCamera: {
    flex: 1,
    width: '100%',
    backgroundColor: 'black',
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: scaleWidth(20),
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingTop: scaleWidth(20),
    paddingHorizontal: scaleWidth(20),
  },
  title: {
    color: 'white',
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: scaleWidth(8),
    fontFamily: 'InstrumentSans-Bold',
  },
  subtitle: {
    color: 'white',
    fontSize: scaleWidth(14),
    textAlign: 'center',
    opacity: 0.8,
    fontFamily: 'InstrumentSans-Regular',
    lineHeight: scaleWidth(20),
  },
  ovalFrame: {
    width: scaleWidth(250),
    height: scaleWidth(320),
    borderWidth: 3,
    borderColor: '#555',
    borderRadius: scaleWidth(160),
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: scaleWidth(30),
    paddingBottom: scaleWidth(20),
    marginBottom: scaleWidth(20),
  },
  backButton: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
  },
  captureButton: {
    width: scaleWidth(70),
    height: scaleWidth(70),
    borderRadius: scaleWidth(35),
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonInner: {
    width: scaleWidth(60),
    height: scaleWidth(60),
    borderRadius: scaleWidth(30),
    backgroundColor: 'white',
  },
  galleryButton: {
    width: scaleWidth(44),
    height: scaleWidth(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    width: scaleWidth(32),
    height: scaleWidth(32),
  },
  navBarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleWidth(15),
    backgroundColor: 'white',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '90%',
  },
  navIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
  },
  navArrow: {
    fontSize: scaleWidth(16),
    color: '#888',
  },
  activeNavItemContainer: {
    backgroundColor: '#CA5A5E',
    width: scaleWidth(44),
    height: scaleWidth(44),
    borderRadius: scaleWidth(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;
