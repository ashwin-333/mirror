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
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { ContinueButton } from '../../components/ContinueButton';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type SignUpScreenProps = {
  navigation: any;
};

export const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSignUp = async () => {
    // Reset error
    setError('');
    
    // Validate inputs
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required');
      return;
    }
    
    if (!termsAgreed) {
      setError('You must agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    try {
      setIsLoading(true);
      // Use both first and last name in the registration
      const fullName = `${firstName} ${lastName}`;
      await register(email, password, fullName);
      // Navigation is handled by the Auth context
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const toggleTermsAgreement = () => {
    setTermsAgreed(!termsAgreed);
    if (error === 'You must agree to the Terms & Conditions and Privacy Policy') {
      setError('');
    }
  };

  const navigateToTerms = () => {
    navigation.navigate('TermsAndConditions');
  };

  const navigateToPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
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
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
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
              
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                </Text>
                <TouchableOpacity onPress={navigateToTerms}>
                  <Text style={[styles.termsText, styles.termsTextUnderlined]}>
                    Terms & Conditions
                  </Text>
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  {' '}and{' '}
                </Text>
                <TouchableOpacity onPress={navigateToPrivacy}>
                  <Text style={[styles.termsText, styles.termsTextUnderlined]}>
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Continue Button right below the confirm password field */}
            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#CA5A5E" />
              ) : (
                <ContinueButton onPress={handleSignUp} />
              )}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
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
    alignItems: 'flex-start',
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
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: scaleWidth(8),
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
  },
  bottomPadding: {
    height: scaleWidth(30),
  }
}); 