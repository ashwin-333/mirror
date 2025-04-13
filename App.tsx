import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import { IphonePro } from './src/screens/IphonePro';
import { CameraScreen } from './src/screens/CameraScreen/CameraScreen';
import { LoadingScreen } from './src/screens/LoadingScreen/LoadingScreen';
import { ResultsScreen } from './src/screens/ResultsScreen/ResultsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen/ProfileScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen/WelcomeScreen';
import { SignUpScreen } from './src/screens/SignUpScreen/SignUpScreen';
import { TermsAndConditionsScreen } from './src/screens/TermsAndConditionsScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';

// Auth Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Import utils
import { initializeBackgroundRemoval } from './src/utils/skinAnalysis';

// Initialize Firebase
import './src/lib/firebase';

// Define the navigation stack parameter lists
type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

type AppStackParamList = {
  Home: undefined;
  Camera: { mode: 'face' | 'hair' };
  Loading: { mode: 'face' | 'hair' };
  Results: { mode: 'face' | 'hair' };
  Profile: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

// Create the stack navigators
const AuthStack = createStackNavigator<AuthStackParamList>();
const AppStack = createStackNavigator<AppStackParamList>();

// Auth navigator
const AuthNavigator = () => {
  return (
    // @ts-ignore - id property is causing type issues
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </AuthStack.Navigator>
  );
};

// App navigator
const AppNavigator = () => {
  return (
    // @ts-ignore - id property is causing type issues
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' }
      }}
    >
      <AppStack.Screen name="Home" component={IphonePro} />
      <AppStack.Screen name="Camera" component={CameraScreen} />
      <AppStack.Screen name="Loading" component={LoadingScreen} />
      <AppStack.Screen name="Results" component={ResultsScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
      <AppStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </AppStack.Navigator>
  );
};

function Navigation() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#CA5A5E" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-Regular.ttf'),
    'InstrumentSans-Bold': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-Bold.ttf'),
    'InstrumentSans-SemiBold': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-SemiBold.ttf'),
    'InstrumentSans-Medium': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-Medium.ttf'),
  });

  useEffect(() => {
    // Initialize the background removal service
    initializeBackgroundRemoval();
  }, []);

  if (!fontsLoaded) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Navigation />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}