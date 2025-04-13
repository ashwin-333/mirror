import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  Home: undefined;
  Camera: { mode: 'face' | 'hair' };
  Loading: { mode: 'face' | 'hair' };
  Results: { mode: 'face' | 'hair' };
  Profile: undefined;
  PrivacyPolicy: undefined;
};

type PrivacyPolicyScreenProps = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation<PrivacyPolicyScreenProps>();
  const lastUpdated = 'Apr 12, 2025';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image
            source={require('../../../assets/back-icon.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
      <ScrollView style={styles.content}>
        <Text style={styles.section}>1. Introduction</Text>
        <Text style={styles.text}>Your privacy is important to us. This Privacy Policy explains how Mirror ("we", "us," or "our") collects, uses, and discloses information when you use our mobile application ("App").</Text>

        <Text style={styles.section}>2. Information We Collect</Text>
        <Text style={styles.text}>Account Information: When you sign up, we may collect your name, email address, and any other details required to create your account.</Text>
        
        <Text style={styles.subsection}>Photo or Image Data:</Text>
        <Text style={styles.text}>When you upload or capture a photo of your face or hair, it is processed by our AI model to generate an analysis (e.g., skin tone/type, hair curliness, dryness).</Text>
        <Text style={styles.text}>We may store these images temporarily on our servers (if at all) solely for processing, unless otherwise stated.</Text>
        
        <Text style={styles.subsection}>User Input:</Text>
        <Text style={styles.text}>If you choose to answer questions, we will ask basic questions regarding dandruff, hair density, and dryness. We collect these answers to provide product recommendations.</Text>
        
        <Text style={styles.subsection}>Bookmarks and Usage Data:</Text>
        <Text style={styles.text}>We track which products you bookmark so you can view them in your profile page.</Text>
        <Text style={styles.text}>We also collect non-personal usage data such as the frequency of use, features used, clicks, etc.</Text>

        <Text style={styles.section}>3. How We Use Your Information</Text>
        <Text style={styles.text}>Provide and Improve the App: We use your personal information to analyze your face or hair, tailor product recommendations, and enable features like bookmarking.</Text>
        <Text style={styles.text}>Customer Support: To respond to your inquiries or troubleshoot any issues.</Text>
        <Text style={styles.text}>Legal Compliance: We may use your information to comply with applicable laws or regulations.</Text>

        <Text style={styles.section}>4. Sharing and Disclosure</Text>
        <Text style={styles.text}>Service Providers: We may share data with third-party vendors who provide hosting, AI analysis, or other services on our behalf. They are bound by contractual obligations to keep your information confidential.</Text>
        <Text style={styles.text}>External Links: When you tap a recommended product link, you will be directed to a third-party website. We do not share your personal details with that third party, but they may collect information based on your interaction with their site.</Text>
        <Text style={styles.text}>Legal Requirements: We may disclose personal information if required by law, court order, or government request, or if we believe it is necessary to protect the rights, property, or safety of our users or the public.</Text>

        <Text style={styles.section}>5. Data Retention</Text>
        <Text style={styles.text}>We keep your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy.</Text>
        <Text style={styles.text}>Bookmarked items and basic account data are retained until you choose to delete your account or remove these items.</Text>

        <Text style={styles.section}>6. Security</Text>
        <Text style={styles.text}>We take reasonable administrative, technical, and physical measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no security measures are foolproof, and we cannot guarantee absolute security.</Text>

        <Text style={styles.section}>7. Children's Privacy</Text>
        <Text style={styles.text}>The App is not intended for children under the age of 13/16/18 [based on jurisdiction]. If you become aware that a child has provided us with personal information without parental consent, please contact us so we can take steps to remove such information.</Text>

        <Text style={styles.section}>8. International Data Transfers</Text>
        <Text style={styles.text}>If you are located outside of [Your Primary Country], your information may be transferred to and processed in the United States or other countries. By using the App, you consent to these transfers.</Text>

        <Text style={styles.section}>9. Your Rights</Text>
        <Text style={styles.text}>Depending on your jurisdiction, you may have the right to:</Text>
        <Text style={styles.bullet}>• Access or delete the personal information we hold about you.</Text>
        <Text style={styles.bullet}>• Correct any inaccuracies in your information.</Text>
        <Text style={styles.bullet}>• Object to or request the restriction of our processing of your information.</Text>
        <Text style={styles.bullet}>• Withdraw consent where we rely on your consent to process your information.</Text>
        <Text style={styles.text}>Please contact us at support@mirror.com to exercise any of these rights.</Text>

        <Text style={styles.section}>10. Changes to This Privacy Policy</Text>
        <Text style={styles.text}>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting an update in the App or emailing you. Your continued use indicates acceptance of the updated Privacy Policy.</Text>

        <Text style={styles.section}>11. Contact Us</Text>
        <Text style={styles.text}>If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact us at:</Text>
        <Text style={styles.text}>Email: support@mirror.com</Text>
      </ScrollView>
      <TouchableOpacity style={styles.gotItButton} onPress={() => navigation.goBack()}>
        <Text style={styles.gotItText}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'InstrumentSans-SemiBold',
    textAlign: 'center',
    marginRight: 40,
    letterSpacing: -0.5,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666666',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  subsection: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 5,
    paddingLeft: 15,
  },
  gotItButton: {
    backgroundColor: '#CA5A5E',
    margin: 20,
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
  },
  gotItText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 