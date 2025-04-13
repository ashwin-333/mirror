import { Image, ImageSourcePropType } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { Asset } from 'expo-asset';
import { GEMINI_API_KEY as ENV_GEMINI_API_KEY } from './env';


// ----------------------
// Constants & Globals
// ----------------------

// These constants mirror those in gemini.py
const SKIN_TONES = [1, 2, 3, 4, 5, 6];
const SKIN_TYPES = ['normal', 'dry', 'oily', 'combination', 'sensitive'];

// Gemini API config
// Initialize with environment value but allow runtime updates
let GEMINI_API_KEY = ENV_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

// Global store for the dataset
let SKINCARE_PRODUCTS_DATASET: any[] = [];

// Fallback dataset (if asset or network fails)
const FALLBACK_PRODUCTS = [
  { 
    product_name: "CeraVe Foaming Facial Cleanser", 
    product_url: "https://www.lookfantastic.com/cerave-foaming-facial-cleanser-473ml/11798746.html",
    product_type: "cleanser", 
    price: 15,
    image_url: "https://static.thcdn.com/images/large/productimg/1600/1600/11798746-1394911951150016.jpg"
  },
  { 
    product_name: "La Roche-Posay Effaclar Purifying Foaming Gel", 
    product_url: "https://www.lookfantastic.com/la-roche-posay-effaclar-purifying-cleansing-gel-400ml/11091750.html",
    product_type: "cleanser", 
    price: 15,
    image_url: "https://static.thcdn.com/images/large/productimg/1600/1600/11091750-2014911951798381.jpg"
  },
  { 
    product_name: "CeraVe Moisturizing Cream", 
    product_url: "https://www.lookfantastic.com/cerave-moisturising-cream-454g/11798747.html",
    product_type: "moisturizer", 
    price: 19,
    image_url: "https://static.thcdn.com/images/large/productimg/1600/1600/11798747-1164911951155794.jpg"
  },
  { 
    product_name: "Paula's Choice 2% BHA Liquid Exfoliant", 
    product_url: "https://www.lookfantastic.com/paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-30ml/11174178.html",
    product_type: "treatment", 
    price: 30,
    image_url: "https://static.thcdn.com/images/large/productimg/1600/1600/11174178-1054909106320233.jpg"
  },
  { 
    product_name: "The Ordinary Niacinamide 10% + Zinc 1%", 
    product_url: "https://www.lookfantastic.com/the-ordinary-niacinamide-10-zinc-1-30ml/11363395.html",
    product_type: "treatment", 
    price: 6,
    image_url: "https://static.thcdn.com/images/large/productimg/1600/1600/11363395-1424889422615295.jpg"
  }
];

// ----------------------
// Type Definitions
// ----------------------
export type SkinAnalysisResult = {
  skinTone: number;
  skinType: string;
  hasAcne: boolean;
  acnePercent: number;
};

export type ProductRecommendation = {
  id: number;
  name: string;
  brand: string;
  description: string;
  price: string;
  image: ImageSourcePropType | string;
  localImage?: string;
  reason?: string;
  url?: string;
};

export type Recommendations = {
  cleansers: ProductRecommendation[];
  moisturizers: ProductRecommendation[];
  treatments: ProductRecommendation[];
};

// ----------------------
// 1) Load the products from JSON instead of CSV
// ----------------------
export const loadSkincareDataset = async (): Promise<any[]> => {
  console.log("\n--- Loading skincare products dataset ---");
  
  // 1. Try loading the JSON file directly
  try {
    console.log("Method 1: Loading from JSON file...");
    const jsonPath = FileSystem.documentDirectory + 'skincare_products.json';
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(jsonPath);
      
      if (fileInfo.exists) {
        console.log(`✓ JSON file exists at: ${jsonPath}`);
        const jsonText = await FileSystem.readAsStringAsync(jsonPath);
        const products = JSON.parse(jsonText);
        
        if (products && products.length > 0) {
          console.log(`✓ Successfully loaded ${products.length} skincare products from JSON file`);
          return products;
        }
      }
    } catch (readError) {
      console.log(`Error reading JSON file: ${readError}`);
    }
    
    // 2. Try loading from the project assets
    console.log("Method 2: Loading from project assets...");
    try {
      const products = require('../data/skincare_products.json');
      if (products && products.length > 0) {
        console.log(`✓ Successfully loaded ${products.length} skincare products from project assets`);
        return products;
      }
    } catch (requireError) {
      console.log(`Error requiring JSON file: ${requireError}`);
    }
    
    // 3. Try downloading from GitHub as a fallback
    try {
      console.log("Method 3: Downloading from GitHub...");
      
      // Create temp directory if needed
      const tempDir = FileSystem.documentDirectory + 'temp/';
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      }
      
      const targetPath = tempDir + 'skincare_products.json';
      
      const downloadResult = await FileSystem.downloadAsync(
        'https://raw.githubusercontent.com/ashwinprasad/mirror/main/src/data/skincare_products.json',
        targetPath
      );
      
      if (downloadResult.status === 200) {
        console.log(`✓ JSON downloaded to ${targetPath}`);
        
        try {
          const jsonText = await FileSystem.readAsStringAsync(targetPath);
          const products = JSON.parse(jsonText);
          
          if (products && products.length > 0) {
            console.log(`✓ Successfully loaded ${products.length} skincare products from GitHub`);
            return products;
          } else {
            console.log("JSON from GitHub parsed but no data found");
          }
        } catch (readError) {
          console.log(`Error reading downloaded JSON: ${readError}`);
        }
      } else {
        console.log(`GitHub download failed with status ${downloadResult.status}`);
      }
    } catch (downloadError) {
      console.log(`Error downloading from GitHub: ${downloadError}`);
    }
    
  } catch (error) {
    console.error('Error loading skincare dataset:', error);
  }
  
  // If all methods fail, use the fallback dataset
  console.log("All loading methods failed. Using fallback dataset.");
  return FALLBACK_PRODUCTS;
};

// ----------------------
// 2) Image-based Skin Analysis (Simulated)
// ----------------------
export const analyzeSkinTone = async (imageUri: string): Promise<number> => {
  console.log("\n--- Analyzing skin tone ---");
  try {
    // Simulate tone analysis using randomness
    const randomVal = Math.random();
    let skinTone = 3;
    if (randomVal < 0.15) skinTone = 1;
    else if (randomVal < 0.35) skinTone = 2;
    else if (randomVal < 0.55) skinTone = 3;
    else if (randomVal < 0.75) skinTone = 4;
    else if (randomVal < 0.9) skinTone = 5;
    else skinTone = 6;
    console.log(`Detected skin tone: ${skinTone}/6 (1 = lightest, 6 = darkest)`);
    return skinTone;
  } catch (error) {
    console.error('Error analyzing skin tone:', error);
    console.log('Using default skin tone: 3');
    return 3;
  }
};

export const analyzeSkinType = async (imageUri: string): Promise<string> => {
  console.log("\n--- Analyzing skin type ---");
  try {
    const randomVal = Math.random();
    let skinType = "normal";
    if (randomVal < 0.25) skinType = "normal";
    else if (randomVal < 0.5) skinType = "dry";
    else if (randomVal < 0.75) skinType = "oily";
    else skinType = "combination"; // or 'sensitive'
    console.log(`Detected skin type: ${skinType}`);
    return skinType;
  } catch (error) {
    console.error('Error analyzing skin type:', error);
    console.log('Using default skin type: normal');
    return 'normal';
  }
};

export const detectAcne = async (imageUri: string): Promise<{hasAcne: boolean, acnePercent: number}> => {
  console.log("\n--- Detecting acne ---");
  try {
    // Simulated acne detection using the hash of imageUri
    const hash = Array.from(imageUri).reduce((hash, char) =>
      ((hash << 5) - hash) + char.charCodeAt(0), 0);
    const acnePercent = (Math.abs(hash) % 150) / 1000;
    const hasAcne = acnePercent > 0.08;
    const finalAcnePercent = acnePercent + 0.45;
    console.log(`Acne detected: ${hasAcne ? 'Yes' : 'No'} (${(finalAcnePercent*100).toFixed(1)}% redness)`);
    return { hasAcne, acnePercent: finalAcnePercent };
  } catch (error) {
    console.error('Error detecting acne:', error);
    console.log('Assuming no acne (default)');
    return { hasAcne: false, acnePercent: 0 };
  }
};

export const analyzeSkin = async (imageUri: string): Promise<SkinAnalysisResult> => {
  console.log("\n========== SKIN ANALYSIS ==========");
  console.log(`Analyzing image: ${imageUri}`);
  const skinTone = await analyzeSkinTone(imageUri);
  const skinType = await analyzeSkinType(imageUri);
  const { hasAcne, acnePercent } = await detectAcne(imageUri);
  console.log("\n--- Analysis Summary ---");
  console.log(`Skin Tone: ${skinTone}/6`);
  console.log(`Skin Type: ${skinType}`);
  console.log(`Acne: ${hasAcne ? 'Yes' : 'No'} (${(acnePercent*100).toFixed(1)}%)`);
  console.log("================================");
  return { skinTone, skinType, hasAcne, acnePercent };
};

// ----------------------
// 3) Utility: Generate Unique Product IDs
// ----------------------
const generateUniqueId = (type: string, index: number): number => {
  if (type === 'cleanser') return 1000 + index;
  if (type === 'moisturizer') return 2000 + index;
  if (type === 'treatment') return 3000 + index;
  return 9000 + index;
};

// ----------------------
// 4) Image URL Utilities
// ----------------------
const generateLookFantasticImageUrl = (productId: string): string[] => {
  return [
    `https://static.thcdn.com/images/large/${productId}.jpg`,
    `https://static.thcdn.com/productimg/1600/1600/${productId}_L.jpg`,
    `https://static.thcdn.com/productimg/original/${productId}_L.jpg`,
    `https://static.thcdn.com/productimg/original/${productId}-1.jpg`,
    `https://static.thcdn.com/images/large/original/${productId}.jpg`,
    `https://static.thcdn.com/productimg/300/300/${productId}.jpg`,
  ];
};

export const findImageForProduct = (product: any): string => {
  try {
    // If the product already has a URL, use it
    if (product.url && product.url.trim() !== '') {
      console.log(`Using product URL for ${product.name || 'unknown'}: ${product.url}`);
      return product.url;
    }
    // Check for product_url field as alternative
    else if (product.product_url && product.product_url.trim() !== '') {
      console.log(`Using product_url for ${product.name || 'unknown'}: ${product.product_url}`);
      return product.product_url;
    }
    // Fallback to placeholder if no URL is available
    else {
      const brandName = product.brand || '';
      const productName = product.name || 'Skincare Product';
      const placeholderUrl = `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(`${brandName}+${productName}`)}`;
      
      console.log(`No URL available, using placeholder for ${brandName} ${productName}`);
      return placeholderUrl;
    }
  } catch (error) {
    console.error('Error finding image for product:', error);
    return `https://via.placeholder.com/300x300.png?text=Skincare+Product`;
  }
};

// ----------------------
// 5) Download Product Image
// ----------------------
export const downloadProductImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log(`Attempting to retrieve image from: ${imageUrl}`);
    // Check if the URL is a LookFantastic product page (not already a direct image link)
    if (imageUrl.includes('lookfantastic.com') && !imageUrl.match(/\.(jpg|jpeg|png|gif)$/)) {
      console.log("Detected LookFantastic product page, extracting image URL...");
      try {
        const response = await axios.get(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });
        if (response.status === 200) {
          const htmlContent: string = response.data;
          let imgUrls: string[] = [];
          const mainImgPatterns = [
            'data-src-desktop="https://static.thcdn.com/p',
            'src="https://www.lookfantastic.com/images?url=https://static.thcdn.com',
            'src="https://static.thcdn.com'
          ];
          // For each pattern, scan the HTML text
          for (const pattern of mainImgPatterns) {
            let startIndex = 0;
            while (true) {
              const patternStart = htmlContent.indexOf(pattern, startIndex);
              if (patternStart === -1) break;
              let quoteStart: number, quoteEnd: number;
              if (pattern === 'data-src-desktop="https://static.thcdn.com/p') {
                quoteStart = patternStart + 'data-src-desktop="'.length;
                quoteEnd = htmlContent.indexOf('"', quoteStart);
                if (quoteEnd > quoteStart) {
                  const imgUrl = htmlContent.substring(quoteStart, quoteEnd);
                  imgUrls.push(imgUrl);
                }
              } else if (pattern === 'src="https://www.lookfantastic.com/images?url=https://static.thcdn.com') {
                quoteStart = patternStart + 'src="'.length;
                quoteEnd = htmlContent.indexOf('"', quoteStart);
                if (quoteEnd > quoteStart) {
                  let imgUrl = htmlContent.substring(quoteStart, quoteEnd);
                  // Extract the actual URL from the parameter
                  const urlParamStart = imgUrl.indexOf("url=") + 4;
                  const urlParamEnd = imgUrl.indexOf("&", urlParamStart);
                  if (urlParamEnd > urlParamStart) {
                    let directUrl = imgUrl.substring(urlParamStart, urlParamEnd);
                    try {
                      // URL decode the direct URL - CRITICAL! this was missing before
                      directUrl = decodeURIComponent(directUrl);
                      imgUrls.push(directUrl);
                    } catch (decodeError) {
                      // If decoding fails, use the raw URL
                      imgUrls.push(directUrl);
                    }
                  }
                }
              } else if (pattern === 'src="https://static.thcdn.com') {
                quoteStart = patternStart + 'src="'.length;
                quoteEnd = htmlContent.indexOf('"', quoteStart);
                if (quoteEnd > quoteStart) {
                  const imgUrl = htmlContent.substring(quoteStart, quoteEnd);
                  imgUrls.push(imgUrl);
                }
              }
              startIndex = patternStart + pattern.length;
            }
          }
          // Fallback: Parse generic <img> tags
          if (imgUrls.length === 0) {
            let startIdx = 0;
            while (true) {
              const imgStart = htmlContent.indexOf('<img', startIdx);
              if (imgStart === -1) break;
              const imgEnd = htmlContent.indexOf('>', imgStart);
              if (imgEnd === -1) break;
              const imgTag = htmlContent.substring(imgStart, imgEnd + 1);
              if (imgTag.includes('src="')) {
                const srcStart = imgTag.indexOf('src="') + 5;
                const srcEnd = imgTag.indexOf('"', srcStart);
                if (srcStart > 5 && srcEnd > srcStart) {
                  const imgSrc = imgTag.substring(srcStart, srcEnd);
                  let skipImage = false;
                  if (imgTag.toLowerCase().includes('brand hasn') || imgTag.toLowerCase().includes('banner')) {
                    skipImage = true;
                  }
                  if (imgTag.includes('alt="')) {
                    const altStart = imgTag.indexOf('alt="') + 5;
                    const altEnd = imgTag.indexOf('"', altStart);
                    if (altEnd > altStart) {
                      const altText = imgTag.substring(altStart, altEnd).toLowerCase();
                      if (altText.includes("brand hasn't joined") || altText.includes("banner")) {
                        skipImage = true;
                      }
                    }
                  }
                  if (!skipImage && imgSrc.includes("static.thcdn.com")) {
                    imgUrls.push(imgSrc);
                  } else if (!skipImage && imgSrc.includes("lookfantastic.com/images") && imgSrc.includes("static.thcdn.com")) {
                    const urlParamStart = imgSrc.indexOf("url=") + 4;
                    const urlParamEnd = imgSrc.indexOf("&", urlParamStart);
                    if (urlParamEnd > urlParamStart) {
                      let directUrl = imgSrc.substring(urlParamStart, urlParamEnd);
                      try {
                        // URL decode the direct URL
                        directUrl = decodeURIComponent(directUrl);
                        imgUrls.push(directUrl);
                      } catch (decodeError) {
                        imgUrls.push(directUrl);
                      }
                    }
                  }
                }
              }
              startIdx = imgEnd + 1;
            }
          }
          // Fallback method 2: Generate URLs from the product ID if still empty
          if (imgUrls.length === 0) {
            try {
              // Extract the product ID from the URL (this is how gemini.py does it)
              const parts = imageUrl.split('/').filter(Boolean);
              const productId = parts[parts.length - 1].split('.')[0];
              
              // Use the same patterns as in gemini.py
              imgUrls.push(`https://static.thcdn.com/images/large/${productId}.jpg`);
              imgUrls.push(`https://static.thcdn.com/productimg/1600/1600/${productId}_L.jpg`);
              imgUrls.push(`https://static.thcdn.com/productimg/original/${productId}_L.jpg`);
              imgUrls.push(`https://static.thcdn.com/productimg/original/${productId}-1.jpg`);
            } catch (e) {
              // Do nothing if this fails
            }
          }
          
          // Try each candidate URL until one works
          for (const candidateUrl of imgUrls) {
            try {
              console.log(`Trying image URL: ${candidateUrl}`);
              const imgResp = await axios.get(candidateUrl, {
                responseType: 'arraybuffer',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
              });
              
              // CRITICAL: Validate this is an actual image by checking content type
              if (imgResp.status === 200 && 
                  imgResp.headers['content-type'] && 
                  imgResp.headers['content-type'].includes('image')) {
                // Save image to Expo FileSystem
                const filename = candidateUrl.split('/').pop() || 'image.jpg';
                const imagePath = FileSystem.documentDirectory + 'products/' + filename;
                // Ensure directory exists
                await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'products/', { intermediates: true }).catch(() => {});
                const base64Str = arrayBufferToBase64(imgResp.data);
                await FileSystem.writeAsStringAsync(imagePath, base64Str, { encoding: FileSystem.EncodingType.Base64 });
                console.log(`Successfully saved image to: ${imagePath}`);
                return imagePath;
              } else {
                console.log(`URL returned non-image content type: ${imgResp.headers['content-type']}`);
              }
            } catch (e) {
              console.log(`Failed with URL ${candidateUrl}: ${e.message || e}`);
            }
          }
          
          // Last resort: Generate placeholder
          console.log("Could not find any working image URLs for this product");
          try {
            const productName = imageUrl.split('/').slice(-2)[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const placeholderUrl = `https://via.placeholder.com/500x500.png?text=${encodeURIComponent(productName)}`;
            console.log(`Generating placeholder image: ${placeholderUrl}`);
            
            const placeholderResp = await axios.get(placeholderUrl, {
              responseType: 'arraybuffer',
              timeout: 5000
            });
            
            if (placeholderResp.status === 200) {
              const imagePath = `${FileSystem.documentDirectory}products/placeholder_${Date.now()}.png`;
              await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}products/`, { intermediates: true }).catch(() => {});
              await FileSystem.writeAsStringAsync(imagePath, arrayBufferToBase64(placeholderResp.data), { encoding: FileSystem.EncodingType.Base64 });
              console.log(`Created placeholder image at: ${imagePath}`);
              return imagePath;
            }
          } catch (placeholderError) {
            console.log(`Placeholder creation failed: ${placeholderError.message || placeholderError}`);
          }
          
          return null;
        } else {
          console.log(`Failed to access product page: ${response.status}`);
        }
      } catch (e) {
        console.log(`Error accessing product page: ${e.message || e}`);
      }
    }
    
    // If the URL is directly an image URL, download it directly
    try {
      console.log(`Direct download attempt from: ${imageUrl}`);
      const directResp = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      // Validate content type
      if (directResp.status === 200 && 
          directResp.headers['content-type'] && 
          directResp.headers['content-type'].includes('image')) {
        const filename = imageUrl.split('/').pop() || 'image.jpg';
        const imagePath = FileSystem.documentDirectory + 'products/' + filename;
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'products/', { intermediates: true }).catch(() => {});
        const base64Str = arrayBufferToBase64(directResp.data);
        await FileSystem.writeAsStringAsync(imagePath, base64Str, { encoding: FileSystem.EncodingType.Base64 });
        console.log(`Successfully saved direct image to: ${imagePath}`);
        return imagePath;
      } else {
        console.log(`Direct URL returned non-image content type: ${directResp.headers['content-type']}`);
      }
    } catch (directError) {
      console.log(`Direct download failed: ${directError.message || directError}`);
    }
    
    return null;
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}: ${error.message || error}`);
    return null;
  }
};

// Helper function to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return global.btoa(binary);
};

// ----------------------
// 6) Gemini API Response Parsing
// ----------------------
export const parseGeminiResponse = (responseText: string): any[] | null => {
  try {
    console.log("Parsing Gemini API response...");
    const jsonStart = responseText.indexOf('[');
    const jsonEnd = responseText.lastIndexOf(']') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonStr = responseText.substring(jsonStart, jsonEnd);
      const recommendations = JSON.parse(jsonStr);
      console.log(`Successfully parsed ${recommendations.length} product recommendations`);
      // Ensure each product has a URL field
      for (const product of recommendations) {
        if ('product_url' in product && !('url' in product)) {
          product.url = product.product_url;
        } else if (!('url' in product)) {
          product.url = null;
        }
      }
      return recommendations;
    } else {
      console.error("Could not find valid JSON in Gemini response.");
      return null;
    }
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return null;
  }
};

// ----------------------
// 7) Gemini Recommendations Request with JSON data
// ----------------------
export const getGeminiRecommendations = async (
  skinType: string, 
  skinTone: number, 
  hasAcne: boolean,
  acnePercent: number,
  concerns: string[] = []
): Promise<any[] | null> => {
  if (!GEMINI_API_KEY) {
    console.error("No Gemini API key set. Using fallback recommendations.");
    return null;
  }
  
  if (SKINCARE_PRODUCTS_DATASET.length === 0) {
    SKINCARE_PRODUCTS_DATASET = await loadSkincareDataset();
  }
  if (SKINCARE_PRODUCTS_DATASET.length === 0) {
    console.error("Could not load skincare dataset. Using fallback recommendations.");
    return null;
  }
  
  try {
    console.log("\n========== GETTING RECOMMENDATIONS ==========");
    console.log("Preparing Gemini API request...");
    
    const context = `
        Skin profile:
        - Skin type: ${skinType}
        - Skin tone: ${skinTone}/6 (where 1 is lightest, 6 is darkest)
        - Acne presence: ${hasAcne ? 'Yes' : 'No'}
        - Acne severity: ${(acnePercent * 100).toFixed(1)}% (based on redness)
        ${concerns.length > 0 ? `- Additional concerns: ${concerns.join(', ')}` : ''}
    `;
    console.log("Skin profile context created");
    
    // Limit dataset to a manageable sample size
    const sampleProducts = SKINCARE_PRODUCTS_DATASET.slice(0, 50);
    
    // Convert sample products to CSV-like format as in gemini.py
    const datasetPreview = JSON.stringify(sampleProducts);
    
    const prompt = `
        You are a skincare expert recommendation system. Based on a user's skin profile and a dataset of skincare products, 
        recommend 9 appropriate products for their needs.

        ${context}

        Below is a sample from the skincare product dataset:

        ${datasetPreview}

        Analyze the properties of these products and select 9 products that would work best for this skin profile.
        Consider the following factors:
        - Choose products appropriate for the user's skin type
        - If the user has acne, suggest products that help with acne
        - Include products from exactly 3 categories: cleanser, moisturizer, and treatment
        - Include EXACTLY 3 cleansers, 3 moisturizers, and 3 treatments (total of 9 products)
        - Consider products that address the user's specific concerns

        Format your response as a JSON array with each product having these fields:
        - name (product name)
        - brand (extract brand from product name)
        - price (numeric value only, without currency symbol)
        - category (product category/type - use "cleanser", "moisturizer", or "treatment" only)
        - url (product URL from the product_url column in dataset)
        - reason (brief explanation of why this product is good for this skin)
        
        IMPORTANT: Output EXACTLY 3 cleansers, 3 moisturizers, and 3 treatments. Only include the JSON array in your response, nothing else.
    `;
    
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY
    };
    
    const data = {
      contents: [
        { parts: [ { text: prompt } ] }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40
      }
    };
    
    console.log("Requesting personalized recommendations from Gemini...");
    const response = await axios.post(GEMINI_API_URL, data, { headers });
    if (response.status !== 200) {
      console.error(`Error from Gemini API: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    console.log("Received response from Gemini API");
    const responseData = response.data;
    const textContent = responseData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!textContent) {
      console.error("No text in Gemini response");
      return null;
    }
    
    const recs = parseGeminiResponse(textContent);
    if (recs) {
      console.log(`Successfully received ${recs.length} product recommendations from Gemini`);
      console.log("========================================");
      return recs;
    }
    console.error("No valid candidates in Gemini API response");
    return null;
  } catch (error) {
    console.error("Error getting Gemini recommendations:", error);
    return null;
  }
};

// ----------------------
// 8) Process Gemini Recommendations into Final Structure
// ----------------------
export const processGeminiRecommendations = async (recommendations: any[]): Promise<Recommendations> => {
  console.log("\n--- Processing Gemini recommendations ---");
  if (!recommendations || recommendations.length === 0) {
    console.log("No recommendations to process");
    return { cleansers: [], moisturizers: [], treatments: [] };
  }
  const result: Recommendations = {
    cleansers: [],
    moisturizers: [],
    treatments: []
  };
  let productCount = 0;
  let successCount = 0;
  for (const product of recommendations) {
    productCount++;
    const category = (product.category || '').toLowerCase();
    let resolvedCategory: 'cleansers' | 'moisturizers' | 'treatments';
    if (category.includes('clean')) resolvedCategory = 'cleansers';
    else if (category.includes('moistur') || category.includes('cream')) resolvedCategory = 'moisturizers';
    else resolvedCategory = 'treatments';
    
    console.log(`\nRECOMMENDATION ${productCount}: ${resolvedCategory.toUpperCase()}`);
    console.log(`- ${product.brand || ''} ${product.name || ''} ($${product.price || ''})`);
    console.log(`  Reason: ${product.reason || 'No reason provided'}`);
    if (product.url) {
      console.log(`  URL: ${product.url}`);
    }
    
    const formattedProduct: ProductRecommendation = {
      id: generateUniqueId(resolvedCategory.slice(0, -1), result[resolvedCategory].length + 1),
      name: product.name || '',
      brand: product.brand || '',
      description: product.name || '',
      price: `$${product.price || '0'}`,
      image: product.image_url || findImageForProduct(product),
      reason: product.reason || '',
      url: product.url || ''
    };
    
    let imageDownloadSuccessful = false;
    try {
      console.log(`Downloading image from: ${formattedProduct.image}`);
      const localImage = await downloadProductImage(formattedProduct.image as string);
      if (localImage) {
        formattedProduct.localImage = localImage;
        console.log(`✓ Image successfully saved locally at: ${localImage}`);
        imageDownloadSuccessful = true;
      } else {
        console.log(`⚠️ Could not download image for ${formattedProduct.brand} ${formattedProduct.name}, skipping product`);
      }
    } catch (error) {
      console.error(`❌ Error downloading image for ${formattedProduct.brand} ${formattedProduct.name}: ${error}`);
      console.log(`Skipping product due to image download failure`);
    }
    
    // Only add the product if image download was successful
    if (imageDownloadSuccessful) {
      result[resolvedCategory].push(formattedProduct);
      successCount++;
    }
  }
  console.log(`\nProcessed ${productCount} recommendations, added ${successCount} products with successful image downloads: ${result.cleansers.length} cleansers, ${result.moisturizers.length} moisturizers, ${result.treatments.length} treatments`);
  return result;
};

// ----------------------
// 9) Hardcoded Fallback Recommendations
// ----------------------
export const getHardcodedRecommendations = async (): Promise<Recommendations> => {
  console.log("\n--- Using hardcoded recommendations ---");
  return {
    cleansers: [
      {
        id: generateUniqueId('cleanser', 1),
        brand: 'CeraVe',
        name: 'CeraVe Foaming Facial Cleanser',
        description: 'Foaming Facial Cleanser',
        price: '$15',
        image: 'https://static.thcdn.com/images/large/productimg/1600/1600/11798746.jpg',
        reason: 'Good for oily skin and acne-prone skin with gentle cleansing properties',
        url: 'https://www.lookfantastic.com/cerave-foaming-facial-cleanser-473ml/11798746.html'
      }
    ],
    moisturizers: [
      {
        id: generateUniqueId('moisturizer', 1),
        brand: 'CeraVe',
        name: 'CeraVe Moisturizing Cream',
        description: 'Moisturizing Cream',
        price: '$19',
        image: 'https://static.thcdn.com/images/large/productimg/1600/1600/11798747.jpg',
        reason: 'Rich moisturizer with ceramides for dry skin',
        url: 'https://www.lookfantastic.com/cerave-moisturising-cream-454g/11798747.html'
      }
    ],
    treatments: [
      {
        id: generateUniqueId('treatment', 1),
        brand: 'The Ordinary',
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        description: 'Niacinamide Serum',
        price: '$6',
        image: 'https://static.thcdn.com/images/large/productimg/1600/1600/11363395.jpg',
        reason: 'Reduces sebum production and inflammation from acne',
        url: 'https://www.lookfantastic.com/the-ordinary-niacinamide-10-zinc-1-30ml/11363395.html'
      },
      {
        id: generateUniqueId('treatment', 2),
        brand: 'Paula\'s Choice',
        name: 'Paula\'s Choice 2% BHA Liquid Exfoliant',
        description: 'BHA Exfoliant',
        price: '$30',
        image: 'https://static.thcdn.com/images/large/productimg/1600/1600/11174178.jpg',
        reason: 'Helps unclog pores and reduce acne',
        url: 'https://www.lookfantastic.com/paula-s-choice-skin-perfecting-2-bha-liquid-exfoliant-30ml/11174178.html'
      },
      {
        id: generateUniqueId('moisturizer', 2),
        brand: 'Neutrogena',
        name: 'Neutrogena Hydro Boost Water Gel',
        description: 'Hydrating Gel',
        price: '$24',
        image: 'https://static.thcdn.com/images/large/productimg/1600/1600/11091620.jpg',
        reason: 'Lightweight gel hydration for oily skin',
        url: 'https://www.lookfantastic.com/neutrogena-hydro-boost-water-gel-moisturiser-50ml/11091620.html'
      }
    ]
  };
};

// ----------------------
// 10) Main Analysis Function
// ----------------------
export const performSkinAnalysis = async (imageUri: string, concerns: string[] = []) => {
  try {
    if (SKINCARE_PRODUCTS_DATASET.length === 0) {
      SKINCARE_PRODUCTS_DATASET = await loadSkincareDataset();
    }
    
    // Perform skin analysis based on the image URI
    const analysis = await analyzeSkin(imageUri);
    
    // Get recommendations using Gemini API or fallback
    let recommendations: Recommendations;
    if (GEMINI_API_KEY) {
      try {
        console.log("Attempting to get recommendations from Gemini API using JSON data...");
        const geminiRecs = await getGeminiRecommendations(
          analysis.skinType,
          analysis.skinTone, 
          analysis.hasAcne, 
          analysis.acnePercent, 
          concerns
        );
        if (geminiRecs && geminiRecs.length > 0) {
          recommendations = await processGeminiRecommendations(geminiRecs);
        } else {
          console.log("Gemini API did not return valid recommendations, using fallback.");
          recommendations = await getHardcodedRecommendations();
        }
      } catch (error) {
        console.error("Error with Gemini recommendations:", error);
        recommendations = await getHardcodedRecommendations();
      }
    } else {
      console.log("No Gemini API key set, using fallback recommendations");
      recommendations = await getHardcodedRecommendations();
    }
    
    console.log("\n========== ANALYSIS COMPLETE ==========");
    console.log(`Total recommendations: ${recommendations.cleansers.length + recommendations.moisturizers.length + recommendations.treatments.length}`);
    return { analysis, recommendations };
  } catch (error) {
    console.error('Error in performSkinAnalysis:', error);
    throw error;
  }
};

// ----------------------
// 11) Set Gemini API Key Utility
// ----------------------
export const setGeminiApiKey = (apiKey: string) => {
  GEMINI_API_KEY = apiKey;
  return !!apiKey;
};
