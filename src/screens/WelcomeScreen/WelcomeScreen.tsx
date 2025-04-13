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
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { EyeSvg } from '../../components/EyeSvg';
import { NoEyeSvg } from '../../components/NoEyeSvg';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login(email, password);
      // Navigation is handled by the Auth context
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSvg width={scaleWidth(22)} height={scaleWidth(22)} color="black" />
                ) : (
                  <NoEyeSvg width={scaleWidth(22)} height={scaleWidth(22)} color="black" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Login Button with Arrow */}
          <View style={styles.loginContainer}>
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#CA5A5E" />
              ) : (
                <>
                  <Text style={styles.loginText}>Log In</Text>
                  <Image 
                    source={require('../../../assets/red-right-arrow.png')} 
                    style={styles.arrowIcon}
                  />
                </>
              )}
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
          
          {/* Extra padding at the bottom for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
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
  bottomPadding: {
    height: scaleWidth(30),
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleWidth(25),
    backgroundColor: '#F5F5F5',
    height: scaleWidth(50),
  },
  passwordInput: {
    flex: 1,
    height: scaleWidth(50),
    paddingHorizontal: scaleWidth(20),
    fontSize: scaleWidth(18),
    fontFamily: 'InstrumentSans-Regular',
    letterSpacing: -1,
  },
  eyeIcon: {
    padding: scaleWidth(10),
    marginRight: scaleWidth(5),
  },
}); 