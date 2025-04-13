import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContinueButton } from '../../components/ContinueButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type HairInfoScreenProps = {
  navigation: any;
  route: {
    params: {
      mode: 'face' | 'hair';
      photoUri?: string;
    };
  };
};

export const HairInfoScreen = ({ navigation, route }: HairInfoScreenProps) => {
  const { mode, photoUri } = route.params;
  const [dandruff, setDandruff] = useState<string | null>(null);
  const [dryness, setDryness] = useState<string | null>(null);
  const [density, setDensity] = useState<string | null>(null);

  // Check if all options are selected
  const allOptionsSelected = dandruff !== null && dryness !== null && density !== null;

  const handleContinue = () => {
    // Validate that all options are selected
    if (!allOptionsSelected) {
      Alert.alert(
        "Selection Required",
        "Please select one option for each category before continuing.",
        [{ text: "OK" }]
      );
      return;
    }

    // Navigate to the loading screen with the selected options
    navigation.navigate('Loading', {
      mode,
      photoUri,
      hairInfo: {
        dandruff,
        dryness,
        density
      }
    });
  };

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
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      
      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>Great,</Text>
        <Text style={styles.subtitle}>Now answer some</Text>
        <Text style={styles.subtitle}>questions to help Mirror</Text>
        <Text style={styles.subtitle}>give you the best results.</Text>
        
        {/* Dandruff section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Dandruff
            {dandruff === null && <Text style={styles.requiredIndicator}>*</Text>}
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.option, dandruff === 'None' && styles.selectedOption]} 
              onPress={() => setDandruff('None')}
            >
              <Text style={[styles.optionText, dandruff === 'None' && styles.selectedOptionText]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, dandruff === 'Light' && styles.selectedOption]} 
              onPress={() => setDandruff('Light')}
            >
              <Text style={[styles.optionText, dandruff === 'Light' && styles.selectedOptionText]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, dandruff === 'Moderate' && styles.selectedOption]} 
              onPress={() => setDandruff('Moderate')}
            >
              <Text style={[styles.optionText, dandruff === 'Moderate' && styles.selectedOptionText]}>Moderate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, dandruff === 'Heavy' && styles.selectedOption]} 
              onPress={() => setDandruff('Heavy')}
            >
              <Text style={[styles.optionText, dandruff === 'Heavy' && styles.selectedOptionText]}>Heavy</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Dryness section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Dryness
            {dryness === null && <Text style={styles.requiredIndicator}>*</Text>}
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.option, dryness === 'None' && styles.selectedOption]} 
              onPress={() => setDryness('None')}
            >
              <Text style={[styles.optionText, dryness === 'None' && styles.selectedOptionText]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, dryness === 'Light' && styles.selectedOption]} 
              onPress={() => setDryness('Light')}
            >
              <Text style={[styles.optionText, dryness === 'Light' && styles.selectedOptionText]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, dryness === 'Moderate' && styles.selectedOption]} 
              onPress={() => setDryness('Moderate')}
            >
              <Text style={[styles.optionText, dryness === 'Moderate' && styles.selectedOptionText]}>Moderate</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, dryness === 'Strong' && styles.selectedOption]} 
              onPress={() => setDryness('Strong')}
            >
              <Text style={[styles.optionText, dryness === 'Strong' && styles.selectedOptionText]}>Strong</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Density section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Density
            {density === null && <Text style={styles.requiredIndicator}>*</Text>}
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.option, density === 'Thin' && styles.selectedOption]} 
              onPress={() => setDensity('Thin')}
            >
              <Text style={[styles.optionText, density === 'Thin' && styles.selectedOptionText]}>Thin</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, density === 'Average' && styles.selectedOption]} 
              onPress={() => setDensity('Average')}
            >
              <Text style={[styles.optionText, density === 'Average' && styles.selectedOptionText]}>Average</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, density === 'Thick' && styles.selectedOption]} 
              onPress={() => setDensity('Thick')}
            >
              <Text style={[styles.optionText, density === 'Thick' && styles.selectedOptionText]}>Thick</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Continue button */}
        <View style={styles.continueButtonWrapper}>
          <ContinueButton 
            onPress={handleContinue} 
            disabled={!allOptionsSelected}
          />
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleWidth(20),
    paddingBottom: scaleWidth(10),
    gap: scaleWidth(8),
  },
  backIconContainer: {
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderRadius: scaleWidth(15),
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: scaleWidth(16),
    height: scaleWidth(16),
  },
  backText: {
    fontSize: scaleWidth(16),
    fontFamily: 'InstrumentSans-Regular',
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    padding: scaleWidth(20),
    paddingTop: scaleWidth(60),
    paddingBottom: scaleWidth(80),
  },
  title: {
    fontSize: scaleWidth(35),
    fontWeight: 'bold',
    marginBottom: scaleWidth(10),
    fontFamily: 'InstrumentSans-Bold',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: scaleWidth(24),
    marginBottom: scaleWidth(0),
    lineHeight: scaleWidth(30),
    fontWeight: '500',
    fontFamily: 'InstrumentSans-Medium',
    letterSpacing: -1,
  },
  sectionContainer: {
    marginTop: scaleWidth(30),
  },
  sectionTitle: {
    fontSize: scaleWidth(22),
    fontWeight: '500',
    marginBottom: scaleWidth(8),
    fontFamily: 'InstrumentSans-Medium',
    letterSpacing: -1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scaleWidth(0),
    width: '100%',
  },
  option: {
    backgroundColor: '#E7E0E0',
    paddingVertical: scaleWidth(12),
    paddingHorizontal: scaleWidth(6),
    borderRadius: scaleWidth(20),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleWidth(65),
    flex: 1,
    marginHorizontal: scaleWidth(4),
  },
  selectedOption: {
    backgroundColor: '#CA5A5E',
  },
  optionText: {
    fontSize: scaleWidth(15),
    fontFamily: 'InstrumentSans-Medium',
    color: '#000000',
    letterSpacing: -1,
  },
  selectedOptionText: {
    color: 'white',
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
    width: scaleWidth(16),
    height: scaleWidth(16),
  },
  continueButtonWrapper: {
    alignItems: 'flex-end',
    marginTop: scaleWidth(40),
  },
  requiredIndicator: {
    color: '#CA5A5E',
    fontSize: scaleWidth(22),
    marginLeft: scaleWidth(5),
    letterSpacing: -1,
  },
});



