import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  UIManager,
  Modal,
  LayoutAnimation,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Define navigation prop type
type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};
type ProfileScreenProps = StackNavigationProp<RootStackParamList, 'Profile'>;

// Product type definition
type Product = {
  id: number;
  name: string;
  subtext: string;
  image: any;
};

// Mock product data
const skinProducts: Product[] = [
  { id: 1, name: 'CeraVe', subtext: 'Foaming Facial Cleanser', image: require('../../../assets/example-cleanser.png') },
  { id: 2, name: "Paula's Choice", subtext: '2% BHA Liquid Exfoliant', image: require('../../../assets/example-cleanser.png') },
  { id: 3, name: 'The Ordinary', subtext: 'Niacinamide + Zinc', image: require('../../../assets/example-cleanser.png') },
];

const hairProducts: Product[] = [
  { id: 1, name: 'CeraVe', subtext: 'Foaming Facial Cleanser', image: require('../../../assets/example-cleanser.png') },
  { id: 2, name: "Paula's Choice", subtext: '2% BHA Liquid Exfoliant', image: require('../../../assets/example-cleanser.png') },
  { id: 3, name: 'The Ordinary', subtext: 'Niacinamide + Zinc', image: require('../../../assets/example-cleanser.png') },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenProps>();
  const { width } = Dimensions.get('window');
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Bookmarked states
  const [bookmarkedSkin, setBookmarkedSkin] = useState<{ [key: number]: boolean }>({
    1: true, 2: true, 3: true,
  });
  const [bookmarkedHair, setBookmarkedHair] = useState<{ [key: number]: boolean }>({
    1: true, 2: true, 3: true,
  });

  // Confirmation modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<{section: 'skin' | 'hair', productId: number} | null>(null);

  // Show confirmation modal
  const showRemoveBookmarkModal = (section: 'skin' | 'hair', productId: number) => {
    // Only show modal if bookmark is currently active
    const isCurrentlyBookmarked = section === 'skin' 
      ? bookmarkedSkin[productId] 
      : bookmarkedHair[productId];
    
    if (isCurrentlyBookmarked) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentProduct({ section, productId });
      setModalVisible(true);
    } else {
      // If not bookmarked, just toggle directly (add bookmark)
      toggleBookmark(section, productId);
    }
  };

  // Confirm bookmark removal
  const confirmRemoveBookmark = () => {
    if (currentProduct) {
      toggleBookmark(currentProduct.section, currentProduct.productId);
    }
    closeModal();
  };

  // Close modal
  const closeModal = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setModalVisible(false);
    setCurrentProduct(null);
  };

  // Toggle bookmark
  const toggleBookmark = (section: 'skin' | 'hair', productId: number) => {
    if (section === 'skin') {
      setBookmarkedSkin((prev) => ({
        ...prev,
        [productId]: !prev[productId],
      }));
    } else {
      setBookmarkedHair((prev) => ({
        ...prev,
        [productId]: !prev[productId],
      }));
    }
  };

  // Handle product card press
  const handleProductPress = (product: Product) => {
    console.log(`Product pressed: ${product.name}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Navigation will be handled by the AuthContext
    } catch (error) {
      Alert.alert('Logout Error', 'There was a problem logging out. Please try again.');
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle terms and privacy navigation
  const handleNavigateToTerms = () => {
    navigation.navigate('TermsAndConditions');
  };

  const handleNavigateToPrivacy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  // Product card component
  const ProductCard = ({
    product,
    section,
    isBookmarked,
  }: {
    product: Product;
    section: 'skin' | 'hair';
    isBookmarked: boolean;
  }) => (
    <View style={styles.productCard}>
      {/* Outer container to allow image overflow */}
      <View style={styles.outerImageContainer}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => handleProductPress(product)}
        >
          <Image
            source={product.image}
            style={styles.productImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.productName}>{product.name}</Text>
      
      <View style={styles.subtextRow}>
        <Text style={styles.productSubtext}>{product.subtext}</Text>
        <TouchableOpacity 
          style={styles.bookmarkButton}
          onPress={() => showRemoveBookmarkModal(section, product.id)}
        >
          <Image 
            source={
              isBookmarked
                ? require('../../../assets/filled-bookmark.png')
                : require('../../../assets/unfilled-bookmark.png')
            }
            style={styles.bookmarkIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Removed the main vertical ScrollView. 
          Instead, we use a plain View so images can overflow upward. */}
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../../assets/back-icon.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require('../../../assets/profile.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editProfileButton}>
              <Image
                source={require('../../../assets/edit-pfp.png')}
                style={styles.editProfileIcon}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileFirstName}>Jacob</Text>
          <Text style={styles.profileLastName}>Abraham</Text>
        </View>

        {/* Bookmarks Section */}
        <View style={styles.sectionContainer}>
          {/* Skin Section */}
          <Text style={styles.categoryTitle}>Skin</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productRow}
            contentContainerStyle={styles.productRowContent}
          >
            {skinProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                section="skin"
                isBookmarked={bookmarkedSkin[product.id]}
              />
            ))}
          </ScrollView>

          {/* Hair Section */}
          <Text style={styles.categoryTitle}>Hair</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productRow}
            contentContainerStyle={styles.productRowContent}
          >
            {hairProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                section="hair"
                isBookmarked={bookmarkedHair[product.id]}
              />
            ))}
          </ScrollView>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutText}>Log Out</Text>
          )}
        </TouchableOpacity>

        {/* Terms and Conditions */}
        <TouchableOpacity 
          style={styles.termsButton}
          onPress={handleNavigateToTerms}
        >
          <Text style={styles.termsText}>Terms and Conditions</Text>
        </TouchableOpacity>

        {/* Privacy Policy */}
        <TouchableOpacity 
          style={styles.termsButton}
          onPress={handleNavigateToPrivacy}
        >
          <Text style={styles.termsText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Bookmark Removal Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Image 
                source={require('../../../assets/filled-bookmark.png')}
                style={styles.modalBookmarkIcon}
                resizeMode="contain"
              />
              <Text style={styles.modalTitle}>Removing Bookmark</Text>
              <Text style={styles.modalText}>
                Are you sure you want to remove this product from your bookmarks? You will not be able to undo this action.
              </Text>
              
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.modalRemoveButton}
                  onPress={confirmRemoveBookmark}
                >
                  <Text style={styles.modalRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main container must NOT clip its children
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Main content container (replacing the outer ScrollView)
  content: {
    flex: 1,
    // No overflow: 'hidden' or borderRadius here
  },
  backButton: {
    padding: 15,
    marginTop: 5,
    marginLeft: 5,
  },
  backIcon: {
    width: 25,
    height: 25,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 10,
    marginTop: -60,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 3,
  },
  editProfileIcon: {
    width: 35,
    height: 35,
  },
  profileFirstName: {
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 36,
    letterSpacing: -1,
    color: '#000000',
    textAlign: 'center',
    marginTop: -5,
  },
  profileLastName: {
    fontFamily: 'InstrumentSans-Bold',
    fontSize: 36,
    letterSpacing: -1,
    color: '#000000',
    marginTop: -10,
    textAlign: 'center',
    marginBottom: -10,
  },
  sectionContainer: {
    marginBottom: 20,
    // Must allow overflow
    overflow: 'visible',
    marginLeft: 20,
    zIndex: 0, // Let product images float above this
  },
  categoryTitle: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 28,
    letterSpacing: -1,
    color: '#000000',
    marginVertical: 10,
    zIndex: 0,
  },
  productRow: {
    // Must allow overflow
    overflow: 'visible',
  },
  productRowContent: {
    marginLeft: 0,
    paddingRight: 20,
    overflow: 'visible',
  },
  productCard: {
    width: 150,
    marginRight: -5,
    position: 'relative',
    alignItems: 'flex-start',
    paddingTop: 60,
    zIndex: 999,
  },
  outerImageContainer: {
    width: 125,
    height: 75,
    position: 'relative',
    marginTop: -50,
    overflow: 'visible',
    zIndex: 999,
  },
  imageContainer: {
    width: 125,
    height: 65,
    backgroundColor: '#E7E0E0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    transform: [{ rotate: '20deg' }],
    position: 'absolute',
    top: -45,
    zIndex: 999,
    // Optional shadow/elevation
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  productName: {
    fontFamily: 'InstrumentSans-Medium',
    fontSize: 18,
    letterSpacing: -0.5,
    color: '#000000',
    textAlign: 'left',
    width: '100%',
    flexWrap: 'wrap',
    marginTop: 0,
  },
  subtextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  productSubtext: {
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 12,
    letterSpacing: -0.5,
    color: '#000000',
    textAlign: 'left',
    width: '70%',
    flexWrap: 'wrap',
  },
  bookmarkButton: {
    width: 20,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  // Explicitly removing any default tint so the PNG's original color is preserved
  bookmarkIcon: {
    marginLeft: -50,
    width: 20,
    height: 25,
    resizeMode: 'contain',
    tintColor: undefined, 
  },
  termsButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  termsText: {
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    letterSpacing: -0.5,
    color: '#333',
    textDecorationLine: 'underline',
  },
  logoutButton: {
    marginTop: 5,
    marginBottom: 10,
    backgroundColor: '#ca5a5e',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    alignSelf: 'center',
    width: '40%',
  },
  logoutText: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 22,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  // New modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    padding: 10,
    alignItems: 'center',
  },
  modalBookmarkIcon: {
    width: 30,
    height: 30,
    marginTop: 10,
    marginBottom: 10,
    resizeMode: 'contain',
    tintColor: undefined, // also ensure no default tint
  },
  modalTitle: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalText: {
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 0,
    marginBottom: -5,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: 'InstrumentSans-Medium',
    fontSize: 22,
    color: '#000',
  },
  modalRemoveButton: {
    flex: 1,
    paddingVertical: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRemoveText: {
    fontFamily: 'InstrumentSans-Medium',
    fontSize: 22,
    color: '#ca5a5e',
  },
});
