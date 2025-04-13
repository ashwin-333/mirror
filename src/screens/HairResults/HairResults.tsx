import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, Linking, ImageStyle, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HairAnalysisResult, HairRecommendations, ProductRecommendation } from '../../utils/hairAnalysis';
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

type HairResultsProps = {
  navigation: any;
  route: {
    params: {
      analysis?: HairAnalysisResult;
      recommendations?: HairRecommendations;
    };
  };
};

// Fallback hair analysis data
const fallbackHairAnalysis: HairAnalysisResult = {
  hairType: 'curly',
  hairTypeConfidence: 0.7,
  allTypes: [
    { type: 'curly', confidence: 0.7 },
    { type: 'straight', confidence: 0.21 },
    { type: 'wavy', confidence: 0.06 },
    { type: 'coily', confidence: 0.03 },
  ]
};

export const HairResults = ({ navigation, route }: HairResultsProps) => {
  const { analysis: routeAnalysis, recommendations: routeRecommendations } = route.params;
  const { user } = useAuth();
  
  // State for hair analysis
  const [hairAnalysis, setHairAnalysis] = useState<HairAnalysisResult | null>(
    routeAnalysis || fallbackHairAnalysis
  );
  
  // State for hair recommendations
  const [hairRecommendations, setHairRecommendations] = useState<HairRecommendations | null>(
    routeRecommendations || { recommendations: [] }
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
  
  // Handle navigation back to home
  const handleReturnHome = () => {
    navigation.navigate('Home');
  };
  
  // Open product URL in browser or image URL if no product URL is available
  const openProductUrl = (product: ProductRecommendation) => {
    // First try to open the product URL if available
    if (product.url) {
      Linking.openURL(product.url).catch(err => 
        console.error('Error opening product URL:', err)
      );
    } 
    // If no product URL but we have an image URL, open a Google search for the product
    else if (typeof product.image === 'string' && product.image !== 'placeholder') {
      // Create a Google search URL for the product
      const searchQuery = `${product.brand} ${product.name}`;
      
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      Linking.openURL(googleSearchUrl).catch(err => 
        console.error('Error opening Google search:', err)
      );
    }
  };
  
  // Toggle bookmark status for a product
  const toggleBookmark = async (productId: string, product: ProductRecommendation) => {
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
      } else if (typeof product.image === 'string' && product.image !== 'placeholder') {
        imageUrl = product.image;
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
        // Add bookmark to server with the transparent image URL
        await authService.addBookmark({
          name: product.name || '',
          description: product.name || '', // Using name as description since that's what we display
          image: imageUrl, // This will now be the transparent image being displayed
          url: product.url,
          brand: product.brand || '',
          category: 'hair',
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

  // Render a hair analysis section
  const renderHairAnalysis = () => {
    const topTypes = hairAnalysis?.allTypes.slice(0, 2) || [];
    
    return (
      <View style={styles.hairAnalysisBox}>
        {topTypes.map((typeData, index) => (
          <Text key={index} style={styles.hairTypePercentage}>
            {Math.round(typeData.confidence * 100)}% {typeData.type}
          </Text>
        ))}
      </View>
    );
  };

  // Render product cards
  const renderProductCard = (product: ProductRecommendation, index: number) => (
    <View 
      key={`hair-${product.id}`} 
      style={styles.productCard}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.brand}</Text>
        <Text style={styles.productDescription}>
          {product.name}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.productImageContainer}
        onPress={() => openProductUrl(product)}
      >
        {product.localImage ? (
          <Image 
            source={{ uri: product.localImage }} 
            style={iconStyles.productImage}
            resizeMode="contain"
          />
        ) : typeof product.image === 'string' && product.image !== 'placeholder' ? (
          <Image 
            source={{ uri: product.image }} 
            style={iconStyles.productImage}
            resizeMode="contain"
          />
        ) : (
          <Image 
            source={require('../../../assets/logo.png')} 
            style={iconStyles.productImage}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.bookmarkButton}
        onPress={() => toggleBookmark(`hair-${product.id}`, product)}
        disabled={isLoading}
      >
        {bookmarkedProducts[`hair-${product.id}`] ? (
          <RedBookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
        ) : (
          <BookmarkIcon width={scaleWidth(24)} height={scaleWidth(24)} />
        )}
      </TouchableOpacity>
    </View>
  );

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
        {/* Hair Analysis section */}
        {renderHairAnalysis()}
        
        {/* Products title */}
        <Text style={styles.productsTitle}>Hair Products</Text>
        
        {/* Product recommendations */}
        <View style={styles.recommendationsContainer}>
          {hairRecommendations && hairRecommendations.recommendations.map((product, index) => 
            renderProductCard(product, index)
          )}
        </View>
        
        {/* Add bottom padding */}
        <View style={{ height: scaleWidth(100) }} />
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
  hairAnalysisBox: {
    backgroundColor: 'white',
    borderRadius: scaleWidth(15),
    padding: scaleWidth(15),
    marginVertical: scaleWidth(20),
    borderWidth: 2,
    borderColor: '#E7E0E0',
    alignItems: 'center',
  },
  hairTypePercentage: {
    fontSize: scaleWidth(24),
    fontWeight: 'bold',
    marginBottom: scaleWidth(5),
    fontFamily: "InstrumentSans-Bold", 
  },
  recommendationsContainer: {
    flex: 1,
    marginBottom: scaleWidth(-100),
  },
  productsTitle: {
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
});

export default HairResults; 