import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, Linking, ImageStyle, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkinAnalysisResult, Recommendations, ProductRecommendation } from '../../utils/skinAnalysis';
import BookmarkIcon from '../../../assets/bookmark.svg';
import RedBookmarkIcon from '../../../assets/redbookmark.svg';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 393;
const scaleWidth = (size: number) => (size / BASE_WIDTH) * SCREEN_WIDTH;

// Define image-specific styles
const iconStyles: Record<string, ImageStyle> = {
  navIcon: {
    width: scaleWidth(24),
    height: scaleWidth(24)
  },
  arrowIcon: {
    width: scaleWidth(12),
    height: scaleWidth(12),
    marginHorizontal: scaleWidth(5)
  },
  productImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.3 }, { rotate: '10deg' }]
  }
};

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
  const { user } = useAuth();
  
  // Use provided analysis or fallback
  const [analysis, setAnalysis] = useState<SkinAnalysisResult>(
    routeAnalysis || fallbackAnalysis
  );
  
  // Use provided recommendations or generate from fallback analysis
  const [recommendations, setRecommendations] = useState<Recommendations>(
    routeRecommendations || { cleansers: [], moisturizers: [], treatments: [] }
  );
  
  // State to track bookmarked products
  const [bookmarkedProducts, setBookmarkedProducts] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load user's bookmarks when component mounts
  useEffect(() => {
    loadUserBookmarks();
  }, [user]);
  
  // Load user's bookmarks from the server
  const loadUserBookmarks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await authService.getBookmarks();
      
      if (response.success && response.data) {
        // Create a map of bookmarked products
        const bookmarksMap: {[key: string]: boolean} = {};
        
        response.data.forEach((bookmark: any) => {
          const key = `${bookmark.category}-${bookmark.productId}`;
          bookmarksMap[key] = true;
        });
        
        setBookmarkedProducts(bookmarksMap);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  // Toggle bookmark status for a product
  const toggleBookmark = async (productId: string, product: ProductRecommendation, category: string) => {
    if (!user) {
      // Removed Alert - silent fail for login requirement
      return;
    }
    
    setIsLoading(true);
    
    try {
      const isCurrentlyBookmarked = bookmarkedProducts[productId];
      
      // Determine the image URL to save
      let imageUrl = '';
      if (product.localImage) {
        imageUrl = product.localImage;
      } else if (typeof product.image === 'string') {
        imageUrl = product.image;
      } else if (product.image && typeof product.image === 'object') {
        // Handle case where image is an imported resource (e.g., require statement)
        // We can't save the actual resource, but we could potentially default to a placeholder URL
        console.log('Warning: Attempted to bookmark product with non-URL image');
      }
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark from server
        await authService.removeBookmark(productId);
        
        // Update local state
        setBookmarkedProducts(prev => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
      } else {
        // Log the image for debugging
        console.log('Saving product with image URL:', imageUrl);
        
        // Add bookmark to server with the transparent image URL
        await authService.addBookmark({
          name: product.name || '',
          description: product.description || '',
          image: imageUrl, // This will now be the transparent image being displayed
          url: product.url,
          brand: product.brand || '',
          category: category === 'cleanser' || category === 'moisturizer' || category === 'treatment' ? 'skin' : 'hair',
          productId: product.id.toString(),
        });
        
        // Update local state
        setBookmarkedProducts(prev => ({
          ...prev,
          [productId]: true
        }));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Removed Alert - silent fail for bookmark errors
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation items data
  const navigationItems = [
    { icon: require('../../../assets/home.png'), active: false, onPress: () => navigation.navigate('Home') },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/scan.png'), active: false, onPress: () => navigation.navigate('Camera') },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/wand.png'), active: false, onPress: () => navigation.navigate('Loading') },
    { icon: require('../../../assets/arrow.png'), active: false },
    { icon: require('../../../assets/tag.png'), active: true },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header with Home button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Results</Text>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={handleReturnHome}
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Skin analysis metrics */}
        <View style={styles.analysisContainer}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Skin Tone</Text>
            <Text style={styles.analysisValue}>{analysis.skinTone}</Text>
            <Text style={styles.analysisSubtext}>1-6</Text>
          </View>
          
          <View style={styles.analysisItem}>
            <Text style={styles.analysisLabel}>Skin Type</Text>
            <Text style={styles.analysisValue}>
              {analysis.skinType.toUpperCase() === 'DRY' ? 'D' : 
               analysis.skinType.toUpperCase() === 'OILY' ? 'O' : 
               analysis.skinType.toUpperCase() === 'NORMAL' ? 'N' : 
               analysis.skinType.toUpperCase() === 'COMBINATION' ? 'C' : 
               analysis.skinType.toUpperCase()}
            </Text>
            <Text style={styles.analysisSubtext}>
              {analysis.skinType.charAt(0).toUpperCase() + analysis.skinType.slice(1).toLowerCase()}
            </Text>
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
            <View 
              key={`cleanser-${product.id}`} 
              style={styles.productCard}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.brand}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.productImageContainer}
                onPress={() => openProductUrl(product.url)}
              >
                {product.localImage ? (
                  <Image 
                    source={{ uri: product.localImage }} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                ) : typeof product.image === 'string' ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={product.image} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
              
              <Text style={styles.productPrice}>{product.price}</Text>
              
              <TouchableOpacity 
                style={styles.bookmarkButton}
                onPress={() => toggleBookmark(`skin-${product.id}`, product, 'cleanser')}
                disabled={isLoading}
              >
                {bookmarkedProducts[`skin-${product.id}`] ? (
                  <RedBookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
                ) : (
                  <BookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
                )}
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Moisturizers */}
          <Text style={styles.categoryTitle}>Moisturizers</Text>
          {recommendations.moisturizers.map(product => (
            <View 
              key={`moisturizer-${product.id}`} 
              style={styles.productCard}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.brand}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.productImageContainer}
                onPress={() => openProductUrl(product.url)}
              >
                {product.localImage ? (
                  <Image 
                    source={{ uri: product.localImage }} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                ) : typeof product.image === 'string' ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={product.image} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
              
              <Text style={styles.productPrice}>{product.price}</Text>
              
              <TouchableOpacity 
                style={styles.bookmarkButton}
                onPress={() => toggleBookmark(`skin-${product.id}`, product, 'moisturizer')}
                disabled={isLoading}
              >
                {bookmarkedProducts[`skin-${product.id}`] ? (
                  <RedBookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
                ) : (
                  <BookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
                )}
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Treatments */}
          <Text style={styles.categoryTitle}>Treatments</Text>
          {recommendations.treatments.map(product => (
            <View 
              key={`treatment-${product.id}`} 
              style={styles.productCard}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.brand}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.productImageContainer}
                onPress={() => openProductUrl(product.url)}
              >
                {product.localImage ? (
                  <Image 
                    source={{ uri: product.localImage }} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                ) : typeof product.image === 'string' ? (
                  <Image 
                    source={{ uri: product.image }} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Image 
                    source={product.image} 
                    style={iconStyles.productImage}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
              
              <Text style={styles.productPrice}>{product.price}</Text>
              
              <TouchableOpacity 
                style={styles.bookmarkButton}
                onPress={() => toggleBookmark(`skin-${product.id}`, product, 'treatment')}
                disabled={isLoading}
              >
                {bookmarkedProducts[`skin-${product.id}`] ? (
                  <RedBookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
                ) : (
                  <BookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
                )}
              </TouchableOpacity>
            </View>
          ))}
          
          {/* Add bottom padding */}
          <View style={{ height: scaleWidth(100) }} />
        </View>
      </ScrollView>
      
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
                  index % 2 === 1 ? iconStyles.arrowIcon : iconStyles.navIcon,
                ]}
                tintColor={item.active ? '#FFFFFF' : '#000000'}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(20),
    paddingTop: scaleWidth(10),
    paddingBottom: scaleWidth(0),
  },
  headerTitle: {
    fontSize: scaleWidth(38),
    fontWeight: 'bold',
    fontFamily: "InstrumentSans-Bold",
  },
  homeButton: {
    backgroundColor: '#CA5A5E',
    paddingVertical: scaleWidth(8),
    paddingHorizontal: scaleWidth(20),
    borderRadius: scaleWidth(20),
  },
  homeButtonText: {
    color: 'white',
    fontSize: scaleWidth(18),
    fontWeight: 'bold',
    fontFamily: "InstrumentSans-Bold",
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
    backgroundColor: 'white',
    borderRadius: scaleWidth(15),
    padding: scaleWidth(15),
    width: '30%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E7E0E0',
  },
  analysisLabel: {
    fontSize: scaleWidth(14),
    color: '#555',
    marginBottom: scaleWidth(8),
    fontFamily: "InstrumentSans-Regular",
  },
  analysisValue: {
    fontSize: scaleWidth(28),
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
    marginBottom: scaleWidth(-100),
  },
  categoryTitle: {
    fontSize: scaleWidth(30),
    fontWeight: 'bold',
    marginTop: scaleWidth(10),
    marginBottom: scaleWidth(15),
    fontFamily: "InstrumentSans-Bold",
  },
  productCard: {
    backgroundColor: '#E7E0E0',
    borderRadius: scaleWidth(15),
    padding: scaleWidth(15),
    marginBottom: scaleWidth(15),
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: scaleWidth(120),
  },
  productInfo: {
    flex: 1,
    paddingRight: scaleWidth(110),
  },
  productName: {
    fontSize: scaleWidth(25),
    fontWeight: 'bold',
    marginBottom: scaleWidth(8),
    fontFamily: "InstrumentSans-Bold",
  },
  productDescription: {
    fontSize: scaleWidth(15),
    color: '#555',
    fontFamily: "InstrumentSans-Regular",
    flexWrap: 'wrap',
  },
  productImageContainer: {
    width: scaleWidth(100),
    height: scaleWidth(100),
    position: 'absolute',
    right: scaleWidth(50),
    top: '50%',
    transform: [{ translateY: scaleWidth(-50) }],
    zIndex: 1,

    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  productPrice: {
    position: 'absolute',
    right: scaleWidth(20),
    bottom: scaleWidth(15),
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    fontFamily: "InstrumentSans-Bold",
  },
  bookmarkButton: {
    position: 'absolute',
    top: scaleWidth(15),
    right: scaleWidth(15),
    zIndex: 2,
  },
  navBarContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaleWidth(10),
    marginBottom: scaleWidth(15),
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: scaleWidth(8),
    width: "90%",
    backgroundColor: "white",
  },
  navItem: {
    width: scaleWidth(42),
    height: scaleWidth(42),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleWidth(21),
  },
  activeNavItem: {
    backgroundColor: "#ca5a5e",
  },
  navIcon: {
    resizeMode: "contain",
  },
});

export default ResultsScreen; 