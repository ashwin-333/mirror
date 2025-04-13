import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkinAnalysisResult, Recommendations, ProductRecommendation } from '../../utils/skinAnalysis';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

type ResultsScreenProps = {
  navigation: any;
  route: {
    params: {
      mode: 'face' | 'hair';
      analysis?: SkinAnalysisResult;
      recommendations?: Recommendations;
    };
  };
};

// Fallback analysis data if none is provided
const fallbackAnalysis: SkinAnalysisResult = {
  skinTone: 6,
  skinType: 'dry',
  hasAcne: true,
  acnePercent: 0.54
};

export const ResultsScreen = ({ navigation, route }: ResultsScreenProps) => {
  const { mode, analysis: routeAnalysis, recommendations: routeRecommendations } = route.params;
  
  // Use provided analysis or fallback
  const [analysis, setAnalysis] = useState<SkinAnalysisResult>(
    routeAnalysis || fallbackAnalysis
  );
  
  // Use provided recommendations or generate from fallback analysis
  const [recommendations, setRecommendations] = useState<Recommendations>(
    routeRecommendations || { cleansers: [], moisturizers: [], treatments: [] }
  );
  
  // Format acne percentage for display
  const acnePercentText = `${Math.round(analysis.acnePercent * 100)}% redness`;
  
  // Handle navigation back to home
  const handleReturnHome = () => {
    navigation.navigate('Home');
  };
  
  // Open product URL in browser
  const openProductUrl = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(err => 
        console.error('Error opening product URL:', err)
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header with return link */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Results</Text>
        <TouchableOpacity 
          style={styles.returnButton}
          onPress={handleReturnHome}
        >
          <View style={styles.backButtonInner}>
            <Text style={styles.returnArrow}>{'<'}</Text>
            <Text style={styles.returnButtonText}>Return to Home</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Skin analysis */}
        <View style={styles.analysisContainer}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Skin Tone</Text>
            <Text style={styles.analysisValue}>{analysis.skinTone}</Text>
            <Text style={styles.analysisSubtext}>1-6</Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Skin Type</Text>
            <Text style={styles.analysisValue}>{analysis.skinType.toUpperCase()}</Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Acne</Text>
            <Text style={styles.analysisValue}>{analysis.hasAcne ? 'YES' : 'NO'}</Text>
            <Text style={styles.analysisSubtext}>{acnePercentText}</Text>
          </View>
        </View>
        
        {/* Product recommendations */}
        <View style={styles.recommendationsContainer}>
          {/* Cleansers */}
          <Text style={styles.categoryTitle}>Cleansers</Text>
          {recommendations.cleansers.map(product => (
            <TouchableOpacity 
              key={`cleanser-${product.id}`} 
              style={styles.productCard}
              onPress={() => openProductUrl(product.url)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.brand}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              <View style={styles.productImageContainer}>
                {product.localImage ? (
                  <Image 
                    source={{ uri: product.localImage }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : typeof product.image === 'string' ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={product.image} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.productPrice}>{product.price}</Text>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Text style={styles.bookmarkIcon}>☐</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          {/* Moisturizers */}
          <Text style={styles.categoryTitle}>Moisturizers</Text>
          {recommendations.moisturizers.map(product => (
            <TouchableOpacity 
              key={`moisturizer-${product.id}`} 
              style={styles.productCard}
              onPress={() => openProductUrl(product.url)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.brand}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              <View style={styles.productImageContainer}>
                {product.localImage ? (
                  <Image 
                    source={{ uri: product.localImage }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : typeof product.image === 'string' ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={product.image} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.productPrice}>{product.price}</Text>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Text style={styles.bookmarkIcon}>☐</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          {/* Treatments */}
          <Text style={styles.categoryTitle}>Treatments</Text>
          {recommendations.treatments.map(product => (
            <TouchableOpacity 
              key={`treatment-${product.id}`} 
              style={styles.productCard}
              onPress={() => openProductUrl(product.url)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.brand}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              <View style={styles.productImageContainer}>
                {product.localImage ? (
                  <Image 
                    source={{ uri: product.localImage }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : typeof product.image === 'string' ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={product.image} 
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.productPrice}>{product.price}</Text>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Text style={styles.bookmarkIcon}>☐</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          
          {/* Add some bottom padding */}
          <View style={{ height: scaleWidth(100) }} />
        </View>
      </ScrollView>
      
      {/* Bottom navigation */}
      <View style={styles.navBarContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <Image 
              source={require('../../../assets/home.png')}
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <Text style={styles.navArrow}>{'>'}</Text>
          
          <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
            <Image 
              source={require('../../../assets/scan.png')}
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <Text style={styles.navArrow}>{'>'}</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Image 
              source={require('../../../assets/wand.png')}
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          <Text style={styles.navArrow}>{'>'}</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Image 
              source={require('../../../assets/tag.png')}
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(10),
    paddingBottom: scaleWidth(10),
  },
  headerTitle: {
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    fontFamily: "InstrumentSans-Bold",
  },
  returnButton: {
    backgroundColor: '#CA5A5E',
    paddingVertical: scaleWidth(6),
    paddingHorizontal: scaleWidth(15),
    borderRadius: scaleWidth(20),
  },
  returnButtonText: {
    color: 'white',
    fontSize: scaleWidth(14),
    fontFamily: "InstrumentSans-Regular",
  },
  returnArrow: {
    color: 'white',
    fontSize: scaleWidth(14),
    marginRight: scaleWidth(4),
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: scaleWidth(20),
  },
  analysisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: scaleWidth(20),
  },
  analysisItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: scaleWidth(15),
    padding: scaleWidth(15),
    width: '30%',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: scaleWidth(14),
    color: '#555',
    marginBottom: scaleWidth(8),
    fontFamily: "InstrumentSans-Regular",
  },
  analysisValue: {
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    marginBottom: scaleWidth(5),
    fontFamily: "InstrumentSans-Bold",
  },
  analysisSubtext: {
    fontSize: scaleWidth(12),
    color: '#888',
    fontFamily: "InstrumentSans-Regular",
  },
  recommendationsContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    marginTop: scaleWidth(20),
    marginBottom: scaleWidth(15),
    fontFamily: "InstrumentSans-Bold",
  },
  productCard: {
    backgroundColor: '#ECECEC',
    borderRadius: scaleWidth(15),
    padding: scaleWidth(15),
    marginBottom: scaleWidth(15),
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  productInfo: {
    flex: 1,
    paddingRight: scaleWidth(10),
  },
  productName: {
    fontSize: scaleWidth(16),
    fontWeight: 'bold',
    marginBottom: scaleWidth(5),
    fontFamily: "InstrumentSans-Bold",
  },
  productDescription: {
    fontSize: scaleWidth(14),
    color: '#555',
    fontFamily: "InstrumentSans-Regular",
  },
  productImageContainer: {
    width: scaleWidth(80),
    height: scaleWidth(80),
    marginRight: scaleWidth(40), // Make space for price
    transform: [{ rotate: '-10deg' }], // Tilt the image container slightly
  },
  productImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.2 }], // Make the image slightly larger to fill the container
  },
  productPrice: {
    position: 'absolute',
    right: scaleWidth(45),
    fontSize: scaleWidth(18),
    fontWeight: 'bold',
    fontFamily: "InstrumentSans-Bold",
  },
  bookmarkButton: {
    position: 'absolute',
    top: scaleWidth(15),
    right: scaleWidth(15),
  },
  bookmarkIcon: {
    fontSize: scaleWidth(24),
    color: '#777',
  },
  navBarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleWidth(10),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '90%',
  },
  navItem: {
    width: scaleWidth(40),
    height: scaleWidth(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleWidth(20),
  },
  activeNavItem: {
    backgroundColor: '#CA5A5E',
  },
  navIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24),
  },
  navArrow: {
    fontSize: scaleWidth(16),
    color: '#888',
  },
});

export default ResultsScreen; 