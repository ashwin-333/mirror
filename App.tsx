import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';
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

// Initialize Firebase
import './src/lib/firebase';

// Define the navigation stack parameter list
type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Home: undefined;
  Camera: { mode: 'face' | 'hair' };
  Loading: { mode: 'face' | 'hair' };
  Results: { mode: 'face' | 'hair' };
  Profile: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

// Create the stack navigator
const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    'InstrumentSans-Regular': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-Regular.ttf'),
    'InstrumentSans-Bold': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-Bold.ttf'),
    'InstrumentSans-SemiBold': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-SemiBold.ttf'),
    'InstrumentSans-Medium': require('./assets/fonts/Instrument_Sans/static/InstrumentSans-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          id="RootNavigator"
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'white' }
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Home" component={IphonePro} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen name="Results" component={ResultsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}