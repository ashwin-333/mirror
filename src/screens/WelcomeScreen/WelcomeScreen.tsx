import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type WelcomeScreenProps = {
  navigation: any;
};

export const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      // Firebase auth removed - just navigate
      navigation.replace('Home');
    } catch (err: any) {
      setError('Login functionality disabled');
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo width={scaleWidth(92)} height={scaleWidth(63)} />
      </View>

      {/* Welcome Text */}
      <Text style={styles.title}>Welcome</Text>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Login Button with Arrow */}
      <View style={styles.loginContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
          <Image 
            source={require('../../../assets/red-right-arrow.png')} 
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Or Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      {/* Create Account Section */}
      <View style={styles.createAccountContainer}>
        <Text style={styles.noAccountText}>Don't have an account?</Text>
        <TouchableOpacity 
          style={styles.createAccountButton} 
          onPress={handleCreateAccount}
        >
          <Text style={styles.createAccountText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    padding: scaleWidth(20),
  },
  logoContainer: {
    marginTop: scaleWidth(50),
    marginBottom: scaleWidth(70),
    alignItems: 'center',
  },
  title: {
    fontSize: scaleWidth(40),
    fontWeight: 'bold',
    marginBottom: scaleWidth(16),
    alignSelf: 'flex-start',
    fontFamily: 'InstrumentSans-Bold',
    letterSpacing: -1,
    paddingLeft: scaleWidth(3),
  },
  inputContainer: {
    width: '100%',
    gap: scaleWidth(16),
    marginBottom: scaleWidth(20),
  },
  input: {
    width: '100%',
    height: scaleWidth(50),
    borderRadius: scaleWidth(25),
    backgroundColor: '#F5F5F5',
    paddingHorizontal: scaleWidth(20),
    fontSize: scaleWidth(18),
    fontFamily: 'InstrumentSans-Regular',
    letterSpacing: -1,
  },
  loginContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: scaleWidth(5),
    marginBottom: scaleWidth(20),
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: scaleWidth(25),
    fontFamily: 'InstrumentSans-SemiBold',
    color: '#000',
    marginRight: scaleWidth(10),
  },
  arrowIcon: {
    width: scaleWidth(30),
    height: scaleWidth(30),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: scaleWidth(20),
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EFEFEF',
  },
  dividerText: {
    paddingHorizontal: scaleWidth(15),
    fontSize: scaleWidth(16),
    color: '#888',
    fontFamily: 'InstrumentSans-Regular',
  },
  createAccountContainer: {
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: scaleWidth(16),
    color: '#000',
    marginBottom: scaleWidth(15),
    fontFamily: 'InstrumentSans-Regular',
  },
  createAccountButton: {
    backgroundColor: '#E7E0E0',
    paddingVertical: scaleWidth(12),
    paddingHorizontal: scaleWidth(30),
    borderRadius: scaleWidth(25),
  },
  createAccountText: {
    fontSize: scaleWidth(20),
    color: '#000',
    fontFamily: 'InstrumentSans-SemiBold',
  },
  errorText: {
    color: 'red',
    marginTop: scaleWidth(16),
    fontFamily: 'InstrumentSans-Regular',
  },
}); 