import { Image, ImageSourcePropType } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { GEMINI_API_KEY as ENV_GEMINI_API_KEY } from './env';
import Constants from 'expo-constants';

// ----------------------
// Constants & Globals
// ----------------------

// Hair types based on the internet.py script
const HAIR_TYPES = ['straight', 'wavy', 'curly', 'coily'];
const DANDRUFF_LEVELS = ['None', 'Light', 'Moderate', 'Heavy'];
const MOISTURE_LEVELS = ['None', 'Light', 'Moderate', 'Strong'];
const DENSITY_LEVELS = ['Thin', 'Average', 'Thick'];

// Gemini API config
// Initialize with environment value but allow runtime updates
let GEMINI_API_KEY = ENV_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

// Server configuration for image processing
const SERVER_PORT = Constants.expoConfig?.extra?.serverPort || '5001';
const DEVELOPER_IP = Constants.expoConfig?.extra?.developerIp || Constants.expoConfig?.extra?.developerId || '100.64.174.222';
const SERVER_URL = `http://${DEVELOPER_IP}:${SERVER_PORT}`;

// Known working URL for background removal
const BACKGROUND_REMOVAL_SERVICE_URL = "http://100.64.174.222:5001/remove-background";

// ----------------------
// Type Definitions
// ----------------------
export type HairTypeConfidence = {
  type: string;
  confidence: number;
};

export type HairAnalysisResult = {
  hairType: string;
  hairTypeConfidence: number;
  allTypes: HairTypeConfidence[];
};

export type HairInfo = {
  dandruff: string | null;
  dryness: string | null;
  density: string | null;
};

export type ProductRecommendation = {
  id: number;
  name: string;
  brand: string;
  type: string;
  price: string;
  image: ImageSourcePropType | string;
  localImage?: string;
  reason?: string;
  url?: string;
};

export type HairRecommendations = {
  recommendations: ProductRecommendation[];
};

// ----------------------
// Hair Analysis Functions
// ----------------------

// Create a prediction function for hair type
export const predictHairType = async (imageUri: string): Promise<HairAnalysisResult> => {
  console.log("\n--- Analyzing hair type ---");
  try {
    // Simulate hair type analysis using randomness
    // In a real app, this would call your ML model
    const randomVal = Math.random();
    let primaryHairType = "straight";
    let primaryConfidence = 0;
    
    if (randomVal < 0.25) {
      primaryHairType = "straight";
      primaryConfidence = 0.65 + (Math.random() * 0.15);
    } else if (randomVal < 0.5) {
      primaryHairType = "wavy";
      primaryConfidence = 0.60 + (Math.random() * 0.15);
    } else if (randomVal < 0.75) {
      primaryHairType = "curly";
      primaryConfidence = 0.70 + (Math.random() * 0.15);
    } else {
      primaryHairType = "coily";
      primaryConfidence = 0.75 + (Math.random() * 0.15);
    }
    
    // Generate confidence values for all hair types, ensuring primary type has highest confidence
    const allTypes: HairTypeConfidence[] = [];
    
    // Add primary type
    allTypes.push({
      type: primaryHairType,
      confidence: primaryConfidence
    });
    
    // Add other types with lower confidence values
    HAIR_TYPES.forEach(type => {
      if (type !== primaryHairType) {
        // Generate a lower confidence value
        const otherConfidence = Math.random() * (1 - primaryConfidence);
        allTypes.push({
          type,
          confidence: otherConfidence
        });
      }
    });
    
    // Sort by confidence in descending order
    allTypes.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`Detected hair type: ${primaryHairType} (confidence: ${(primaryConfidence * 100).toFixed(1)}%)`);
    
    for (const type of allTypes) {
      console.log(`${type.type}: ${(type.confidence * 100).toFixed(1)}%`);
    }
    
    return { 
      hairType: primaryHairType,
      hairTypeConfidence: primaryConfidence,
      allTypes
    };
  } catch (error) {
    console.error('Error analyzing hair type:', error);
    console.log('Using default hair type: straight');
    
    // Create default values for allTypes
    const defaultAllTypes: HairTypeConfidence[] = [
      { type: 'straight', confidence: 0.5 },
      { type: 'wavy', confidence: 0.2 },
      { type: 'curly', confidence: 0.2 },
      { type: 'coily', confidence: 0.1 }
    ];
    
    return {
      hairType: 'straight',
      hairTypeConfidence: 0.5,
      allTypes: defaultAllTypes
    };
  }
};

// Function to check if the background removal server is available
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${SERVER_URL}/health`);
    return response.status === 200;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};

// Function to search for products on LookFantastic
export const searchProductOnLookFantastic = async (product_name: string, brand: string): Promise<string | null> => {
  try {
    console.log(`Searching for ${brand} ${product_name} on LookFantastic...`);
    
    // Format the search query
    const search_query = `${brand} ${product_name}`;
    const search_url = `https://www.lookfantastic.com/search?q=${encodeURIComponent(search_query)}`;
    
    // Create headers to mimic a browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
    
    // Send the request
    console.log(`Sending request to: ${search_url}`);
    const response = await axios.get(search_url, { headers, timeout: 15000 });
    
    if (response.status !== 200) {
      console.log(`Failed to search LookFantastic: ${response.status}`);
      return null;
    }
    
    // Parse the HTML
    const html = response.data;
    
    // Find product links - try multiple patterns to be robust
    let productUrls: string[] = [];
    
    // Pattern 1: Look for product blocks
    const productBlockRegex = /<a\s+[^>]*href="([^"]*\/products\/[^"]*)"[^>]*>/gi;
    let match;
    while ((match = productBlockRegex.exec(html)) !== null) {
      if (match[1]) {
        productUrls.push(match[1]);
      }
    }
    
    // Pattern 2: Another common pattern in LookFantastic
    const productItemRegex = /href="(\/[^"]*\/products\/[^"]*)"/gi;
    while ((match = productItemRegex.exec(html)) !== null) {
      if (match[1]) {
        productUrls.push(match[1]);
      }
    }
    
    // Pattern 3: Direct product links
    const directProductRegex = /href="(https:\/\/www\.lookfantastic\.com[^"]*\/products\/[^"]*)"/gi;
    while ((match = directProductRegex.exec(html)) !== null) {
      if (match[1]) {
        productUrls.push(match[1]);
      }
    }
    
    // Filter out duplicates
    productUrls = Array.from(new Set(productUrls));
    
    // Make URLs absolute if needed
    productUrls = productUrls.map(url => {
      if (url.startsWith('http')) {
        return url;
      } else {
        return `https://www.lookfantastic.com${url}`;
      }
    });
    
    if (productUrls.length > 0) {
      console.log(`Found ${productUrls.length} product URLs, using the first one: ${productUrls[0]}`);
      return productUrls[0];
    }
    
    console.log(`No product URLs found for ${brand} ${product_name}`);
    return null;
  } catch (error) {
    console.error(`Error searching for product:`, error);
    return null;
  }
};

// Function to extract product image URL from LookFantastic product page
export const getProductImageFromLookFantastic = async (product_url: string): Promise<string | null> => {
  try {
    console.log(`Extracting image from ${product_url}...`);
    
    // Create headers to mimic a browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
    
    // Send the request
    const response = await axios.get(product_url, { headers, timeout: 15000 });
    
    if (response.status !== 200) {
      console.log(`Failed to access product page: ${response.status}`);
      return null;
    }
    
    // Parse HTML
    const html = response.data;
    
    // Try multiple patterns to find image URLs
    const img_urls: string[] = [];
    
    // Pattern 1: Look for main product image
    const mainImageRegex = /<img[^>]*class="[^"]*athenaProductImageCarousel_image[^"]*"[^>]*src="([^"]+)"[^>]*>/i;
    const mainMatch = html.match(mainImageRegex);
    if (mainMatch && mainMatch[1]) {
      img_urls.push(mainMatch[1]);
    }
    
    // Pattern 2: Look for high-quality product images
    const highQualityRegex = /"(https:\/\/static\.thcdn\.com\/images\/large\/[^"]+)"/gi;
    let match;
    while ((match = highQualityRegex.exec(html)) !== null) {
      img_urls.push(match[1]);
    }
    
    // Pattern 3: Look for data-src attributes
    const dataSrcRegex = /data-src="(https:\/\/[^"]*thcdn\.com[^"]*\.(jpg|jpeg|png|webp))"/gi;
    while ((match = dataSrcRegex.exec(html)) !== null) {
      img_urls.push(match[1]);
    }
    
    // Pattern 4: Look for any image URLs with thcdn.com domain
    const anyImageRegex = /"(https:\/\/[^"]*thcdn\.com[^"]*\.(jpg|jpeg|png|webp))"/gi;
    while ((match = anyImageRegex.exec(html)) !== null) {
      img_urls.push(match[1]);
    }
    
    // Filter out duplicates and non-product images
    const filteredUrls = Array.from(new Set(img_urls)).filter(url => {
      // Skip small thumbnails and UI elements
      return !url.includes('icon') && !url.includes('thumb') && !url.includes('logo');
    });
    
    if (filteredUrls.length > 0) {
      console.log(`Found ${filteredUrls.length} product images, using the first one`);
      return filteredUrls[0];
    }
    
    console.log(`Could not find any product images on the page`);
    return null;
  } catch (error) {
    console.error(`Error extracting product image:`, error);
    return null;
  }
};

// Function to find product images using the appropriate method based on product type
export const findProductImage = async (product_name: string, brand: string, product_type: string): Promise<{imageUrl: string | null, productUrl: string | null}> => {
  try {
    console.log(`Finding image for ${brand} ${product_name} (${product_type})`);
    
    // Use client-side approach directly to ensure it works
    return await findProductImageFallback(product_name, brand, product_type);
  } catch (error) {
    console.error(`Error finding product image:`, error);
    return { imageUrl: null, productUrl: null };
  }
};

// Fallback method for finding product images using client-side implementation
export const findProductImageFallback = async (product_name: string, brand: string, product_type: string = ""): Promise<{imageUrl: string | null, productUrl: string | null}> => {
  try {
    // First try LookFantastic
    const productUrl = await searchProductOnLookFantastic(product_name, brand);
    
    if (productUrl) {
      // Extract the product image from the product page
      const imageUrl = await getProductImageFromLookFantastic(productUrl);
      if (imageUrl) {
        return { imageUrl, productUrl };
      }
    }
    
    // If LookFantastic fails, try Google (just like in internet.py)
    const googleImageUrl = await searchProductOnGoogle(product_name, brand, product_type);
    if (googleImageUrl) {
      return { imageUrl: googleImageUrl, productUrl: null };
    }
    
    return { imageUrl: null, productUrl: null };
  } catch (error) {
    console.error(`Error in findProductImageFallback:`, error);
    return { imageUrl: null, productUrl: null };
  }
};

// Function to download and process a product image
export const downloadAndProcessImage = async (imageUrl: string, productId: number): Promise<string | null> => {
  try {
    console.log(`Processing product image: ${imageUrl}`);
    
    // Use the background removal service that is known to work for skin products
    console.log(`Using background removal API at ${BACKGROUND_REMOVAL_SERVICE_URL}`);
    
    try {
      const response = await axios.post(BACKGROUND_REMOVAL_SERVICE_URL, {
        imageUrl: imageUrl
      }, { timeout: 30000 }); // Allow enough time for processing
      
      if (response.data.success && response.data.base64Image) {
        console.log('Successfully processed image using background removal API');
        return response.data.base64Image;
      } else {
        console.log('Background removal API returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error(`Error processing image with background removal API:`, error);
    }
    
    // Fall back to original image if processing failed
    console.log('Image processing failed, using original image URL');
    return imageUrl;
  } catch (error) {
    console.error(`Error processing product image:`, error);
    return null;
  }
};

// Get hair product recommendations using Gemini API
export const getGeminiHairRecommendations = async (
  hairType: string, 
  dandruff: string | null, 
  dryness: string | null,
  density: string | null
): Promise<any[] | null> => {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API key not found");
    return null;
  }

  try {
    console.log("\n--- Getting hair product recommendations from Gemini ---");
    
    // Prepare the prompt - exact copy from internet.py
    const prompt = 
      `You are a hair care expert. Based on this profile:
- Hair Type: ${hairType}
- Dandruff: ${dandruff || 'None'}
- Moisture Level: ${dryness || 'Normal'}
- Hair Density: ${density || 'Medium'}

Recommend 5 specific hair products with these requirements:
1. Each product must be from a different mainstream, well-known brand (like L'Oreal, Pantene, etc.)
2. Include a mix of product types (shampoo, conditioner, serum, etc.)
3. All products should be specific (include full product name and brand)
4. Each product should be available on LookFantastic.com or similar retailers

For each product, provide:
1. Exact product name with brand
2. Product type (shampoo, conditioner, etc.)
3. Estimated price range
4. A brief explanation of why it's good for this hair type

Format your response as a JSON array with each product having these fields:
- name (full product name including brand)
- brand (just the brand name)
- type (product type/category)
- price_estimate (numeric value only in USD, without currency symbol)
- reason (brief explanation of why this product is good for this hair)

Only include the JSON array in your response, nothing else.`;

    console.log(`Prompt prepared, sending request to Gemini API...`);
    
    // Make the API request
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
      }
    );

    // Extract the text response
    const responseText = response.data.candidates[0].content.parts[0].text;
    
    // Parse the JSON response
    try {
      // Extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const jsonText = jsonMatch[0];
        const recommendations = JSON.parse(jsonText);
        console.log(`Successfully parsed ${recommendations.length} recommendations`);
        return recommendations;
      } else {
        console.error("No JSON array found in Gemini response");
        console.log("Raw response:", responseText);
        return null;
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", responseText);
      return null;
    }
  } catch (error) {
    console.error("Error getting recommendations from Gemini:", error);
    return null;
  }
};

// Generate a unique ID for each product
const generateUniqueId = (productInfo: any, index: number): number => {
  const baseNumber = 3000; // Different base than skin products
  return baseNumber + index;
};

// Process Gemini recommendations into the format needed by the app
export const processRecommendations = async (recommendations: any[]): Promise<HairRecommendations> => {
  console.log("\n--- Processing hair recommendations ---");
  
  if (!recommendations || recommendations.length === 0) {
    console.log("No recommendations to process");
    return { recommendations: [] };
  }
  
  const processedRecommendations: ProductRecommendation[] = [];
  
  // Process each recommendation
  for (let i = 0; i < recommendations.length; i++) {
    const rec = recommendations[i];
    
    try {
      const id = generateUniqueId(rec, i);
      
      // Find product image on LookFantastic or Google
      const { imageUrl, productUrl } = await findProductImage(
        rec.name,
        rec.brand,
        rec.type // Pass the product type for better search results
      );
      
      // Process image to remove background if available
      let localImage = null;
      if (imageUrl) {
        localImage = await downloadAndProcessImage(imageUrl, id);
      }
      
      // Create a processed recommendation
      const processedRec: ProductRecommendation = {
        id,
        name: rec.name || "Unknown Product",
        brand: rec.brand || "Unknown Brand",
        type: rec.type || "Unknown Type",
        price: `$${rec.price_estimate || "??"}`,
        image: imageUrl || "placeholder",
        reason: rec.reason || "Recommended for your hair type",
        url: productUrl || undefined
      };
      
      // Add local image path if available
      if (localImage) {
        processedRec.localImage = localImage;
      }
      
      processedRecommendations.push(processedRec);
      
    } catch (error) {
      console.error(`Error processing recommendation ${i}:`, error);
    }
  }
  
  console.log(`Processed ${processedRecommendations.length} recommendations`);
  
  return {
    recommendations: processedRecommendations
  };
};

// Fallback recommendations if API fails
export const getFallbackRecommendations = (): HairRecommendations => {
  return {
    recommendations: [
      {
        id: 3001,
        name: "OGX Biotin & Collagen Shampoo",
        brand: "OGX",
        type: "shampoo",
        price: "$8",
        image: "placeholder", // Just use a string placeholder
        reason: "Adds volume and thickness to fine hair"
      },
      {
        id: 3002,
        name: "Pantene Pro-V Hydrating Conditioner",
        brand: "Pantene",
        type: "conditioner",
        price: "$6",
        image: "placeholder", // Just use a string placeholder
        reason: "Provides essential moisture for dry hair"
      },
      {
        id: 3003,
        name: "L'Oreal Paris Elvive Total Repair 5 Damage-Erasing Balm",
        brand: "L'Oreal",
        type: "treatment",
        price: "$9",
        image: "placeholder", // Just use a string placeholder
        reason: "Repairs damaged hair and prevents split ends"
      },
      {
        id: 3004,
        name: "John Frieda Frizz Ease Extra Strength Serum",
        brand: "John Frieda",
        type: "serum",
        price: "$12",
        image: "placeholder", // Just use a string placeholder
        reason: "Eliminates frizz and smooths hair"
      },
      {
        id: 3005,
        name: "Aveda Invati Advanced Scalp Revitalizer",
        brand: "Aveda",
        type: "treatment",
        price: "$65",
        image: "placeholder", // Just use a string placeholder
        reason: "Reduces hair loss and promotes growth"
      }
    ]
  };
};

// Main function to perform hair analysis
export const performHairAnalysis = async (imageUri: string, hairInfo: HairInfo) => {
  console.log("\n========== HAIR ANALYSIS ==========");
  console.log(`Analyzing image: ${imageUri}`);
  
  try {
    // Analyze hair type from image
    const hairAnalysis = await predictHairType(imageUri);
    
    // Log the user-provided hair info
    console.log("\n--- User Hair Info ---");
    console.log(`Dandruff: ${hairInfo.dandruff || 'Not specified'}`);
    console.log(`Dryness: ${hairInfo.dryness || 'Not specified'}`);
    console.log(`Density: ${hairInfo.density || 'Not specified'}`);
    
    // Get product recommendations
    let recommendations = await getGeminiHairRecommendations(
      hairAnalysis.hairType,
      hairInfo.dandruff,
      hairInfo.dryness,
      hairInfo.density
    );
    
    // Process recommendations
    let processedRecommendations;
    
    if (recommendations && recommendations.length > 0) {
      processedRecommendations = await processRecommendations(recommendations);
    } else {
      console.log("Using fallback recommendations");
      processedRecommendations = getFallbackRecommendations();
    }
    
    return {
      analysis: hairAnalysis,
      recommendations: processedRecommendations
    };
  } catch (error) {
    console.error("Error performing hair analysis:", error);
    
    // Return fallback data
    return {
      analysis: {
        hairType: "straight",
        hairTypeConfidence: 0.5,
        allTypes: [
          { type: 'straight', confidence: 0.5 },
          { type: 'wavy', confidence: 0.2 },
          { type: 'curly', confidence: 0.2 },
          { type: 'coily', confidence: 0.1 }
        ]
      },
      recommendations: getFallbackRecommendations()
    };
  }
};

// Helper function to update Gemini API key
export const setGeminiApiKey = (apiKey: string) => {
  GEMINI_API_KEY = apiKey;
  console.log("Gemini API key updated");
};

// Function to search for product images on Google (like in internet.py)
export const searchProductOnGoogle = async (product_name: string, brand: string, product_type: string): Promise<string | null> => {
  try {
    console.log(`LookFantastic search failed, trying Google...`);
    console.log(`Searching for ${brand} ${product_name} image on Google...`);
    
    // Format the search query to explicitly look for product images
    const search_query = `${brand} ${product_name} ${product_type} product image`;
    const search_url = `https://www.google.com/search?q=${encodeURIComponent(search_query)}&tbm=isch`;
    
    // Create headers to mimic a browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
    
    // Send the request
    const response = await axios.get(search_url, { headers, timeout: 10000 });
    
    if (response.status !== 200) {
      console.log(`Failed to search Google: ${response.status}`);
      return null;
    }
    
    // Parse the HTML to extract image URLs using regex
    const html = response.data;
    
    // Extract image URLs using regex pattern matching (more reliable than parsing)
    const pattern = /https:\/\/[^"']+\.(?:jpg|jpeg|png|webp)/g;
    const matches = html.match(pattern);
    
    if (!matches || matches.length === 0) {
      console.log("Could not find any suitable product images on Google");
      return null;
    }
    
    // Filter out low-quality and thumbnail images
    const filteredUrls = matches.filter(url => {
      // Skip small thumbnails and icons
      if (url.includes('icon') || url.includes('thumb') || url.includes('small')) {
        return false;
      }
      // Skip Google UI images
      if (url.includes('google.com')) {
        return false;
      }
      return true;
    });
    
    if (filteredUrls.length > 0) {
      console.log(`Found image on Google: ${filteredUrls[0]}`);
      return filteredUrls[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching Google for product image:`, error);
    return null;
  }
}; 