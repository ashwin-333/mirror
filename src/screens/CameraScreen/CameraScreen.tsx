import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean>(false);
  
  // Use regular ref for CameraView
  const cameraRef = useRef<any>(null);
  
  // Define camera facing
  const cameraFacing = 'front'; // Always use front camera for both modes

  useEffect(() => {
    (async () => {
      // Request permissions using the hook
      await requestPermission();
      if (permission) {
        setHasPermission(permission.status === 'granted');
      }
      
      // Check media library permissions
      const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();
      setMediaLibraryPermission(mediaLibraryStatus.status === 'granted');
    })();
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!hasPermission) {
      // If no permission, request it again
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          "Camera Permission Required",
          "We need camera access to take photos. Please enable it in your settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      setHasPermission(true);
    }
    
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        // If hair mode, go to HairInfo screen, otherwise go directly to Loading
        if (mode === 'hair') {
          navigation.navigate('HairInfo', { mode, photoUri: photo.uri });
        } else {
          navigation.navigate('Loading', { mode, photoUri: photo.uri });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        navigation.navigate('Loading', { mode });
      }
    } else {
      navigation.navigate('Loading', { mode });
    }
  };

  const handleSelectPhoto = async () => {
    // Check and request permission
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (newStatus !== 'granted') {
          Alert.alert(
            "Gallery Access Required",
            "We need access to your photo library. Please enable it in your settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }
      
      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // If hair mode, go to HairInfo screen, otherwise go directly to Loading
        if (mode === 'hair') {
          navigation.navigate('HairInfo', { mode, photoUri: result.assets[0].uri });
        } else {
          navigation.navigate('Loading', { mode, photoUri: result.assets[0].uri });
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
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
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, { marginTop: 10, backgroundColor: '#666' }]}
            onPress={() => {
              if (mode === 'hair') {
                navigation.navigate('HairInfo', { mode });
              } else {
                navigation.navigate('Loading', { mode });
              }
            }}
          >
            <Text style={styles.permissionButtonText}>Continue Anyway</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Navigation items data
  const navigationItems = [
    { icon: require('../../../assets/home.png'), active: false, onPress: () => navigation.navigate('Home') },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/scan.png'), active: true },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/wand.png'), active: false },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/tag.png'), active: false },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.mainContainer}>
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

                  <TouchableOpacity style={styles.galleryButton} onPress={handleSelectPhoto}>
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
                  <TouchableOpacity style={styles.galleryButton} onPress={handleSelectPhoto}>
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
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: scaleWidth(10),
    paddingHorizontal: scaleWidth(10),
    paddingBottom: scaleWidth(90),
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: 'black',
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
    borderRadius: scaleWidth(20),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: scaleWidth(15),
  },
  camera: {
    flex: 1,
    backgroundColor: 'black',
    borderBottomLeftRadius: scaleWidth(20),
    borderBottomRightRadius: scaleWidth(20),
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  ovalFrame: {
    width: scaleWidth(240),
    height: scaleWidth(320),
    borderRadius: scaleWidth(120),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignSelf: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'black',
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    width: 28,
    height: 28,
    tintColor: 'white',
  },
  mockCamera: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'space-between',
    borderBottomLeftRadius: scaleWidth(20),
    borderBottomRightRadius: scaleWidth(20),
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

export default CameraScreen;
