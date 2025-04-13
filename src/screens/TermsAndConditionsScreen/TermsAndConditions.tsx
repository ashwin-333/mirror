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
  TermsAndConditions: undefined;
};

type TermsAndConditionsScreenProps = StackNavigationProp<RootStackParamList, 'TermsAndConditions'>;

const TermsAndConditions = () => {
  const navigation = useNavigation<TermsAndConditionsScreenProps>();
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
        <Text style={styles.title}>Terms and Conditions</Text>
      </View>
      <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
      <ScrollView style={styles.content}>
        <Text style={styles.section}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>Welcome ("we", "us," or "our"). By downloading, accessing or using this Mirror mobile application ("App"), you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, please do not use or access the App.</Text>

        <Text style={styles.section}>2. Description of the Service</Text>
        <Text style={styles.text}>Mirror is a mobile application that allows users to:</Text>
        <Text style={styles.bullet}>• Capture or upload a photo of their face or hair for analysis.</Text>
        <Text style={styles.bullet}>• If choosing the skin option, answer basic questions regarding skin tone, skin type, acne level, hair curliness/straightness, and other relevant attributes.</Text>
        <Text style={styles.bullet}>• Use an AI model that analyzes the user's image to assess skin tone, skin type, acne level, hair curliness/straightness, and other relevant attributes.</Text>
        <Text style={styles.bullet}>• Receive product recommendations based on these parameters, including but not limited to skincare products and view recommendations.</Text>
        <Text style={styles.bullet}>• Click external links to purchase recommended products from third-party websites.</Text>

        <Text style={styles.section}>3. App Usage and User Obligations</Text>
        <Text style={styles.text}>Eligibility: You must be at least the age of majority in your jurisdiction (e.g., 18 years old in most places) to use the App, or have the permission of a parent or legal guardian.</Text>
        <Text style={styles.text}>Accurate Information: You agree to provide accurate and truthful information when prompted (e.g., regarding your skin concerns, dandruff, or dryness).</Text>
        <Text style={styles.text}>Medical Disclaimer:</Text>
        <Text style={styles.text}>The information and recommendations provided by the AI model are for informational purposes only and do not constitute medical advice or treatment.</Text>
        <Text style={styles.text}>Always seek the advice of a qualified healthcare provider for concerns regarding your health or skin/hair conditions.</Text>
        <Text style={styles.text}>Prohibited Conduct: You agree not to use the App to:</Text>
        <Text style={styles.bullet}>• Violate any local, state, national, or international law.</Text>
        <Text style={styles.bullet}>• Upload content that is unlawful, harmful, or infringes the rights of others.</Text>
        <Text style={styles.bullet}>• Reverse engineer, decompile, or otherwise tamper with the App's code or security features.</Text>

        <Text style={styles.section}>4. Intellectual Property and Content Ownership</Text>
        <Text style={styles.text}>All software, text, images (excluding user images), logos and other content in the App ("Content") belong to Mirror and/or its licensors.</Text>
        <Text style={styles.text}>Limited License: Subject to your compliance with these Terms, we grant you a personal, non-exclusive, non-transferable, revocable license to access and use the App on your personal device.</Text>
        <Text style={styles.text}>User-Generated Content: By uploading photos or other content, you grant Mirror a non-exclusive license to process such content for the purposes of providing the services described in these Terms.</Text>

        <Text style={styles.section}>5. Third-Party Links and External Purchases</Text>
        <Text style={styles.text}>Third-Party Websites: The App may include links to external websites or services that are not owned or controlled by us. We assume no responsibility for the content, privacy policies, or practices of these third-party sites.</Text>
        <Text style={styles.text}>Purchases: When you tap on any recommended product link, you can be redirected to a third-party website. Mirror is not responsible for any transaction or contract for sale established between you and the third-party seller, and assumes no responsibility for the quality, safety, legality, or any aspect of products purchased through these external links.</Text>

        <Text style={styles.section}>6. Product Recommendations</Text>
        <Text style={styles.text}>All product recommendations provided by Mirror are based on the AI's analysis of your responses to questions. The recommendations are provided as suggestions only. Mirror does not make any guarantees about the suitability, effectiveness, or safety of these products.</Text>

        <Text style={styles.section}>7. Bookmarks</Text>
        <Text style={styles.text}>The App allows users to bookmark certain products for easy reference. Bookmarks are stored in user accounts. We do not share your bookmarked items with third parties unless required by law or authorized by you.</Text>

        <Text style={styles.section}>8. Limitation of Liability</Text>
        <Text style={styles.text}>To the maximum extent permitted by law, Mirror and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the App or reliance on any it provides.</Text>
        <Text style={styles.text}>Use at Your Own Risk: You acknowledge that you use the App at your own risk and that Mirror cannot guarantee error-free or accurate results from the AI model.</Text>

        <Text style={styles.section}>9. Indemnification</Text>
        <Text style={styles.text}>You agree to indemnify and hold Mirror, its affiliates, officers, directors, employees, and agents harmless from any claims or losses arising out of or related to your breach of these Terms or your violation of any law or rights of a third party.</Text>

        <Text style={styles.section}>10. Modifications and Updates</Text>
        <Text style={styles.text}>We may update or modify the App and these Terms at any time. If we make significant changes, we will provide reasonable notice (continued use of the App after such changes constitutes acceptance of the updated Terms).</Text>

        <Text style={styles.section}>11. Governing Law</Text>
        <Text style={styles.text}>These Terms and your use of the App shall be governed by and construed in accordance with the laws of [Applicable Jurisdiction]. Any legal action shall be filed in the courts located in [Jurisdiction].</Text>

        <Text style={styles.section}>12. Contact Information</Text>
        <Text style={styles.text}>If you have questions or concerns about these Terms:</Text>
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

export default TermsAndConditions; 