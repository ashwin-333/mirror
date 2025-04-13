import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { ContinueButton } from '../../components/ContinueButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type SignUpScreenProps = {
  navigation: any;
};

export const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const handleSignUp = async () => {
    if (!termsAgreed) {
      setError('You must agree to the Terms & Conditions and Privacy Policy');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Firebase auth removed - just navigate
      navigation.replace('Home');
    } catch (err: any) {
      setError('Signup functionality disabled');
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Welcome');
  };

  const toggleTermsAgreement = () => {
    setTermsAgreed(!termsAgreed);
    if (error === 'You must agree to the Terms & Conditions and Privacy Policy') {
      setError('');
    }
  };

  const navigateToTerms = () => {
    // Will navigate to Terms & Conditions in the future
    console.log('Navigate to Terms & Conditions');
  };

  const navigateToPrivacy = () => {
    // Will navigate to Privacy Policy in the future
    console.log('Navigate to Privacy Policy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo width={scaleWidth(92)} height={scaleWidth(63)} />
      </View>

      {/* Back to Login Button */}
      <View style={styles.backToLoginContainer}>
        <TouchableOpacity 
          style={styles.backToLoginButton} 
          onPress={handleBackToLogin}
        >
          <Image
            source={require('../../../assets/gray-back-arrow.png')}
            style={styles.backArrowIcon}
          />
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Up Text */}
      <Text style={styles.title}>Sign Up</Text>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        {/* Terms and Conditions Agreement */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={toggleTermsAgreement}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox, 
              termsAgreed && styles.checkboxChecked
            ]} />
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text 
              style={styles.termsTextUnderlined}
              onPress={navigateToTerms}
            >
              Terms & Conditions
            </Text>
            {' '}and{' '}
            <Text 
              style={styles.termsTextUnderlined}
              onPress={navigateToPrivacy}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
        
        {/* Continue Button right below the confirm password field */}
        <View style={styles.buttonContainer}>
          <ContinueButton onPress={handleSignUp} />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    marginBottom: scaleWidth(50),
    alignItems: 'center',
  },
  backToLoginContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: scaleWidth(20),
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowIcon: {
    width: scaleWidth(28),
    height: scaleWidth(28),
    marginRight: scaleWidth(6),
  },
  backToLoginText: {
    fontSize: scaleWidth(22),
    color: '#000',
    fontFamily: 'InstrumentSans-Regular',
    letterSpacing: -1,
  },
  title: {
    fontSize: scaleWidth(40),
    fontWeight: 'bold',
    marginBottom: scaleWidth(16),
    alignSelf: 'flex-start',
    fontFamily: 'InstrumentSans-Bold',
    paddingLeft: scaleWidth(5),
    letterSpacing: -1,
  },
  inputContainer: {
    width: '100%',
    gap: scaleWidth(16),
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleWidth(3),
    marginBottom: scaleWidth(4),
    marginLeft: scaleWidth(5),
  },
  checkboxContainer: {
    padding: scaleWidth(5), // Add padding to make touch target larger
  },
  checkbox: {
    width: scaleWidth(22),
    height: scaleWidth(22),
    borderRadius: scaleWidth(14),
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: 'transparent',
    marginRight: scaleWidth(5),
  },
  checkboxChecked: {
    backgroundColor: '#CA5A5E',
    borderColor: '#000',
  },
  termsText: {
    fontSize: scaleWidth(12),
    fontFamily: 'InstrumentSans-Medium',
    color: '#000',
    flexShrink: 1,
  },
  termsTextUnderlined: {
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#CA5A5E',
    marginTop: scaleWidth(16),
    fontSize: scaleWidth(12),
    fontFamily: 'InstrumentSans-Regular',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: scaleWidth(8),
  }
}); 