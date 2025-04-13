import React, { useState, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/api';

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
  id: number | string;
  name: string;
  subtext: string;
  image: any;
  url?: string;
  brand?: string;
  category?: 'skin' | 'hair';
};

// Bookmark type definition
type Bookmark = {
  _id?: string;
  name: string;
  description: string;
  image: string;
  url?: string;
  brand: string;
  category: 'skin' | 'hair';
  productId: string;
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

// Profile image storage key
const PROFILE_IMAGE_KEY = '@profile_image';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenProps>();
  const { width } = Dimensions.get('window');
  const { user, logout, checkUserStatus } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get user's name and split into first/last name parts
  const userName = user?.name || 'User Name';
  const nameParts = userName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // State for profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  
  // State for bookmarks
  const [skinBookmarks, setSkinBookmarks] = useState<Product[]>([]);
  const [hairBookmarks, setHairBookmarks] = useState<Product[]>([]);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false);
  
  // Load profile image when user data changes
  useEffect(() => {
    console.log('ProfileScreen: User object changed:', JSON.stringify({
      hasUser: !!user,
      userId: user?._id,
      userName: user?.name,
      hasProfileImage: !!user?.profileImage,
      profileImageType: typeof user?.profileImage
    }));
    
    if (user?.profileImage) {
      console.log('ProfileScreen: Using profile image from user data:', user.profileImage);
      // The image is now a URL from the server
      setProfileImage(user.profileImage);
      // Also save to local storage as a fallback
      saveProfileImageToLocalStorage(user.profileImage);
    } else {
      console.log('ProfileScreen: No profile image in user data, using default avatar');
      // Clear any existing profile image to ensure proper reset between accounts
      AsyncStorage.removeItem(PROFILE_IMAGE_KEY).then(() => {
        setProfileImage(null);
      });
    }
    
    // Load bookmarks when user changes
    loadBookmarks();
  }, [user]);
  
  // Load profile image from local storage (fallback)
  const loadProfileImageFromLocalStorage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile image from local storage:', error);
    }
  };
  
  // Save profile image to local storage (fallback)
  const saveProfileImageToLocalStorage = async (imageUri: string) => {
    try {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, imageUri);
    } catch (error) {
      console.error('Error saving profile image to local storage:', error);
    }
  };
  
  // Load bookmarks from the server
  const loadBookmarks = async () => {
    if (!user) return;
    
    try {
      setIsLoadingBookmarks(true);
      const response = await authService.getBookmarks();
      console.log('Loaded bookmarks response:', response);
      
      if (response.success && response.data) {
        const skinProducts: Product[] = [];
        const hairProducts: Product[] = [];
        
        // Convert database bookmarks to UI products
        response.data.forEach((bookmark: Bookmark) => {
          console.log('Processing bookmark:', bookmark);
          
          // Create the product with proper image handling
          const product: Product = {
            id: bookmark.productId,
            name: bookmark.brand || '',
            subtext: bookmark.name || bookmark.description || '',
            image: bookmark.image && bookmark.image.length > 0
              ? { uri: bookmark.image }
              : require('../../../assets/example-cleanser.png'),
            url: bookmark.url,
            brand: bookmark.brand,
            category: bookmark.category
          };
          
          console.log('Created product with image:', typeof product.image, product.image);
          
          if (bookmark.category === 'skin') {
            skinProducts.push(product);
          } else if (bookmark.category === 'hair') {
            hairProducts.push(product);
          }
        });
        
        setSkinBookmarks(skinProducts);
        setHairBookmarks(hairProducts);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      // Fall back to mock data if loading fails
      if (skinBookmarks.length === 0 && hairBookmarks.length === 0) {
        setSkinBookmarks(skinProducts);
        setHairBookmarks(hairProducts);
      }
    } finally {
      setIsLoadingBookmarks(false);
    }
  };
  
  // Handle profile image editing
  const handleEditProfileImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        // Removed Alert - silent fail for permission requirement
        return;
      }
      
      setLoadingImage(true);
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        
        try {
          // Sanitize the URI before upload in case it has special characters
          // First get proper file info
          const uriParts = selectedImageUri.split('/');
          const originalName = uriParts[uriParts.length - 1];
          
          // Check for problematic characters in the filename
          if (originalName.includes('=') || originalName.includes('?') || originalName.includes('&')) {
            console.log('ProfileScreen: Detected special characters in filename:', originalName);
            
            // Create a temporary file with a sanitized name if needed
            // For most cases, the upload middleware will handle this on the server
          }
          
          console.log('ProfileScreen: Uploading image with URI:', selectedImageUri);
          
          // Upload image to server
          const serverImageUrl = await authService.uploadProfileImage(selectedImageUri);
          console.log('ProfileScreen: Image uploaded to server, URL:', serverImageUrl);
          
          // Immediately refresh user data to get the updated profile image from MongoDB
          await checkUserStatus();
          
          // Also update local state and storage as a fallback
          setProfileImage(serverImageUrl);
          saveProfileImageToLocalStorage(serverImageUrl);
          
        } catch (uploadError) {
          console.error('Failed to upload image to server:', uploadError);
          
          // Fall back to local storage if server upload fails
          setProfileImage(selectedImageUri);
          saveProfileImageToLocalStorage(selectedImageUri);
          
          // Removed Alert - silent fail for image upload errors
        }
      }
    } catch (error) {
      // Removed Alert - silent fail for image picking errors
      console.error('Error picking image:', error);
    } finally {
      setLoadingImage(false);
    }
  };
  
  // Confirmation modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<{section: 'skin' | 'hair', productId: number | string} | null>(null);

  // Show confirmation modal for removing bookmark
  const showRemoveBookmarkModal = (section: 'skin' | 'hair', productId: number | string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentProduct({ section, productId });
    setModalVisible(true);
  };

  // Confirm bookmark removal
  const confirmRemoveBookmark = async () => {
    if (!currentProduct || !user) {
      closeModal();
      return;
    }
    
    try {
      setIsLoadingBookmarks(true);
      
      // Format the bookmark ID for the server
      const bookmarkId = `${currentProduct.section}-${currentProduct.productId}`;
      
      // Remove from server
      await authService.removeBookmark(bookmarkId);
      
      // Update local state
      if (currentProduct.section === 'skin') {
        setSkinBookmarks(prev => prev.filter(product => product.id.toString() !== currentProduct.productId.toString()));
      } else {
        setHairBookmarks(prev => prev.filter(product => product.id.toString() !== currentProduct.productId.toString()));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      // Removed Alert - silent fail for bookmark removal errors
    } finally {
      setIsLoadingBookmarks(false);
      closeModal();
    }
  };

  // Close modal
  const closeModal = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setModalVisible(false);
    setCurrentProduct(null);
  };

  // Handle product card press
  const handleProductPress = (product: Product) => {
    // Open URL or search if url exists
    if (product.url) {
      Linking.openURL(product.url).catch(err => 
        console.error('Error opening product URL:', err)
      );
    } else if (product.name && product.subtext) {
      // Create a Google search for the product
      const searchQuery = `${product.name} ${product.subtext}`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      Linking.openURL(googleSearchUrl).catch(err => 
        console.error('Error opening Google search:', err)
      );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Navigation will be handled by the AuthContext
    } catch (error) {
      // Removed Alert - silent fail for logout errors
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

  // Empty bookmarks component
  const EmptyBookmarks = ({ section }: { section: string }) => (
    <View style={styles.emptyBookmarksContainer}>
      <Text style={styles.emptyBookmarksText}>
        You don't have any {section.toLowerCase()} products bookmarked yet.
      </Text>
    </View>
  );

  // Product card component
  const ProductCard = ({
    product,
    section,
  }: {
    product: Product;
    section: 'skin' | 'hair';
  }) => {
    // Debug image source
    console.log(`Rendering product card for ${product.name}, image:`, product.image);
    
    return (
      <View style={styles.productCard}>
        {/* Outer container to allow image overflow */}
        <View style={styles.outerImageContainer}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => handleProductPress(product)}
          >
            <Image
              source={typeof product.image === 'string' ? { uri: product.image } : product.image}
              style={styles.productImage}
              resizeMode="contain"
              onError={(e) => console.error('Image failed to load:', e.nativeEvent.error, product.image)}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.productName}>{product.name}</Text>
        
        <View style={styles.subtextRow}>
          <Text style={styles.productSubtext}>{product.subtext}</Text>
          <TouchableOpacity 
            style={styles.bookmarkButton}
            onPress={() => showRemoveBookmarkModal(section, product.id)}
            disabled={isLoadingBookmarks}
          >
            <Image 
              source={require('../../../assets/filled-bookmark.png')}
              style={styles.bookmarkIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
            {loadingImage ? (
              <View style={[styles.profileImage, styles.profileImageLoading]}>
                <ActivityIndicator size="large" color="#CA5A5E" />
              </View>
            ) : (
              <Image
                source={profileImage ? { uri: profileImage } : require('../../../assets/profile-avatar.png')}
                style={styles.profileImage}
                onError={(error) => {
                  console.error('Image loading error:', error.nativeEvent.error);
                  setProfileImage(null);
                }}
              />
            )}
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfileImage}
              disabled={loadingImage}
            >
              <Image
                source={require('../../../assets/edit-pfp.png')}
                style={styles.editProfileIcon}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileFirstName}>{firstName}</Text>
          {lastName ? <Text style={styles.profileLastName}>{lastName}</Text> : null}
        </View>

        {/* Bookmarks Section */}
        <View style={styles.sectionContainer}>
          {/* Skin Section */}
          <Text style={styles.categoryTitle}>Skin</Text>
          {isLoadingBookmarks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#CA5A5E" />
            </View>
          ) : skinBookmarks.length === 0 ? (
            <EmptyBookmarks section="Skin" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productRow}
              contentContainerStyle={styles.productRowContent}
            >
              {skinBookmarks.map((product) => (
                <ProductCard
                  key={`skin-${product.id}`}
                  product={product}
                  section="skin"
                />
              ))}
            </ScrollView>
          )}

          {/* Hair Section */}
          <Text style={styles.categoryTitle}>Hair</Text>
          {isLoadingBookmarks ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#CA5A5E" />
            </View>
          ) : hairBookmarks.length === 0 ? (
            <EmptyBookmarks section="Hair" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productRow}
              contentContainerStyle={styles.productRowContent}
            >
              {hairBookmarks.map((product) => (
                <ProductCard
                  key={`hair-${product.id}`}
                  product={product}
                  section="hair"
                />
              ))}
            </ScrollView>
          )}
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
    marginTop: -40,
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
  profileImageLoading: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  // New styles for empty bookmarks state and loading
  emptyBookmarksContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  emptyBookmarksText: {
    fontFamily: 'InstrumentSans-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#888',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
