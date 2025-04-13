import cv2
import numpy as np
import os
import argparse
import random
import sys
import urllib.request
import shutil
import traceback
import json
import pandas as pd
from pathlib import Path
import requests
from PIL import Image
from io import BytesIO
import dotenv

# Load environment variables
dotenv.load_dotenv()

# Add root dir to sys.path for module imports
ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, ROOT_DIR)

# Gemini API configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")  # Get API key from environment or use empty string
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

# Constants
SKIN_TONES = [1, 2, 3, 4, 5, 6]
SKIN_TYPES = ['normal', 'dry', 'oily', 'combination', 'sensitive']

# Add rembg for background removal
try:
    from rembg import remove as remove_bg
    REMBG_AVAILABLE = True
    print("Successfully imported rembg for background removal")
except ImportError:
    REMBG_AVAILABLE = False
    print("rembg not installed. Will attempt to install it.")
    try:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "rembg"])
        from rembg import remove as remove_bg
        REMBG_AVAILABLE = True
        print("Successfully installed and imported rembg")
    except Exception as e:
        print(f"Could not install rembg: {str(e)}")
        print("Will proceed without background removal")

def set_gemini_api_key():
    """Prompt user to enter Gemini API key if not already set"""
    global GEMINI_API_KEY
    
    # If already loaded from environment, use it
    if GEMINI_API_KEY:
        print("✓ Gemini API key loaded from environment!")
        return GEMINI_API_KEY
    
    # Otherwise prompt user
    print("\nPlease enter your Google Gemini API key for personalized recommendations:")
    GEMINI_API_KEY = input().strip()
    
    if GEMINI_API_KEY:
        print("✓ Gemini API key set successfully!")
    else:
        print("⚠️ No Gemini API key provided. Will use fallback recommendations.")
    
    return GEMINI_API_KEY

def load_skincare_dataset():
    """Load the skincare products dataset"""
    csv_path = os.path.join(ROOT_DIR, "skincare_products_clean.csv")
    
    try:
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} skincare products from dataset")
        # Print the actual column names to help with debugging
        print(f"Dataset columns: {df.columns.tolist()}")
        return df
    except Exception as e:
        print(f"Error loading skincare dataset: {str(e)}")
        return None

def load_image(image_path):
    """Load an image and return it, or None if it can't be read"""
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return None
    
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read image at {image_path}")
        return None
    
    return img

def analyze_skin_tone(image):
    """Analyze skin tone using a simplified approach"""
    # In a real app, this would use your skin tone model
    # For this simple version, we'll use color averaging to estimate tone
    
    # Convert to the right color space and get average values
    hsv_img = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv_img)
    
    # Take the middle region of the image as likely face area
    height, width = image.shape[:2]
    face_region = hsv_img[height//4:3*height//4, width//4:3*width//4]
    
    # Calculate average color values
    avg_h = np.mean(face_region[:,:,0])
    avg_s = np.mean(face_region[:,:,1])
    avg_v = np.mean(face_region[:,:,2])
    
    # Simple mapping of value (brightness) to skin tone
    # Lower values (darker) = higher tone number
    # This is extremely simplified compared to your actual model
    if avg_v > 200:
        skin_tone = 1  # Very light
    elif avg_v > 180:
        skin_tone = 2  # Light
    elif avg_v > 160:
        skin_tone = 3  # Medium light
    elif avg_v > 140:
        skin_tone = 4  # Medium
    elif avg_v > 120:
        skin_tone = 5  # Medium dark
    else:
        skin_tone = 6  # Dark
    
    return skin_tone, (avg_h, avg_s, avg_v)

def analyze_skin_type(image):
    """Determine skin type based on image analysis"""
    # In a real app, this would use your skin type model
    # For this simple version, we use color/texture approximation
    
    hsv_img = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    ycrcb_img = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
    
    # Get the middle region of the image (face area)
    height, width = image.shape[:2]
    face_region = image[height//4:3*height//4, width//4:3*width//4]
    face_hsv = hsv_img[height//4:3*height//4, width//4:3*width//4]
    face_ycrcb = ycrcb_img[height//4:3*height//4, width//4:3*width//4]
    
    # Calculate standard deviation of saturation as a measure of skin evenness
    s_std = np.std(face_hsv[:,:,1])
    
    # Calculate average luminance
    avg_y = np.mean(face_ycrcb[:,:,0])
    
    # Simplified logic for skin type determination
    if s_std > 35:
        skin_type = 'combination'  # High variance in color
    elif avg_y < 130:
        skin_type = 'dry'  # Darker/duller complexion
    elif avg_y > 180:
        skin_type = 'oily'  # Brighter/shinier complexion
    else:
        skin_type = 'normal'  # Middle values
    
    return skin_type

def detect_acne(image):
    """Detect presence of acne in the image"""
    # In a real app, this would use your acne model
    # For this simple version, we'll use color analysis to estimate
    
    # Convert to the right color space
    hsv_img = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    
    # Focus on the middle part of the image (face area)
    height, width = image.shape[:2]
    face_region = hsv_img[height//4:3*height//4, width//4:3*width//4]
    
    # Look for reddish hues that might indicate acne
    # Simplified thresholds for red/pink tones
    lower_red = np.array([0, 70, 50])
    upper_red = np.array([10, 255, 255])
    lower_red2 = np.array([170, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    
    # Create masks for red regions
    mask1 = cv2.inRange(face_region, lower_red, upper_red)
    mask2 = cv2.inRange(face_region, lower_red2, upper_red2)
    
    # Combine masks
    red_mask = mask1 + mask2
    
    # Calculate percentage of pixels that are in the red range
    red_pixel_percent = np.sum(red_mask > 0) / (face_region.shape[0] * face_region.shape[1])
    
    # ADJUSTED: Use 8% as the threshold for acne detection
    has_acne = red_pixel_percent > 0.08
    
    return has_acne, red_pixel_percent

def create_feature_vector(skin_type, has_acne, acne_percent=0, concerns=None):
    """Create a feature vector for the recommendation system"""
    # Features used by the recommender
    features = ['normal', 'dry', 'oily', 'combination', 'acne', 'sensitive', 'fine lines', 'wrinkles', 'redness',
               'dull', 'pore', 'pigmentation', 'blackheads', 'whiteheads', 'blemishes', 'dark circles', 'eye bags', 'dark spots']
    
    # Initialize vector
    vector = [0] * len(features)
    
    # Set skin type
    if skin_type in features:
        vector[features.index(skin_type)] = 1
    
    # Set acne and calculate severity (scale 0-1 based on redness percentage)
    if has_acne:
        acne_idx = features.index('acne')
        # Normalize acne percentage to a scale of 0-1 for severity
        acne_severity = min(1.0, acne_percent * 5)  # Cap at 1.0
        vector[acne_idx] = acne_severity

    # Add additional concerns if provided
    if concerns:
        for concern in concerns:
            if concern in features:
                vector[features.index(concern)] = 1
    
    return vector

def get_gemini_recommendations(skincare_df, skin_type, skin_tone, has_acne, acne_percent, concerns=None):
    """Get personalized product recommendations using Gemini API"""
    if not GEMINI_API_KEY:
        print("No Gemini API key set. Using fallback recommendations.")
        return None
    
    if skincare_df is None or len(skincare_df) == 0:
        print("Skincare dataset not available for Gemini recommendations.")
        return None
    
    try:
        # Create a context string describing the user's skin profile
        context = f"""
        Skin profile:
        - Skin type: {skin_type}
        - Skin tone: {skin_tone}/6 (where 1 is lightest, 6 is darkest)
        - Acne presence: {'Yes' if has_acne else 'No'}
        - Acne severity: {acne_percent*100:.1f}% (based on redness)
        """
        
        if concerns and len(concerns) > 0:
            context += f"- Additional concerns: {', '.join(concerns)}\n"
        
        # Create a condensed version of the dataset to include in the prompt
        # Include only necessary columns and a subset of products to keep prompt size manageable
        sample_products = skincare_df.sample(min(50, len(skincare_df)))
        # Use the actual column names from the dataset
        dataset_preview = sample_products[['product_name', 'product_url', 'product_type', 'price']].to_csv(index=False)
        
        # Prepare the prompt for Gemini
        prompt = f"""
        You are a skincare expert recommendation system. Based on a user's skin profile and a dataset of skincare products, 
        recommend 10 appropriate products for their needs.

        {context}

        Below is a sample from the skincare product dataset:

        {dataset_preview}

        Analyze the properties of these products and select 10 products that would work best for this skin profile.
        Consider the following factors:
        - Choose products appropriate for the user's skin type
        - If the user has acne, suggest products that help with acne
        - Include a mix of product categories (cleanser, moisturizer, serum, etc.)
        - Consider products that address the user's specific concerns

        Format your response as a JSON array with each product having these fields:
        - name (product name)
        - brand (extract brand from product name)
        - price (numeric value only, without currency symbol)
        - category (product category/type)
        - url (product URL from the product_url column in dataset)
        - reason (brief explanation of why this product is good for this skin)
        
        Only include the JSON array in your response, nothing else.
        """
        
        # Prepare API request
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
        }
        
        data = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048,
                "topP": 0.8,
                "topK": 40
            }
        }
        
        # Make API request
        print("Requesting personalized recommendations from Gemini...")
        response = requests.post(GEMINI_API_URL, headers=headers, json=data, timeout=30)
        
        if response.status_code != 200:
            print(f"Error from Gemini API: {response.status_code} - {response.text}")
            return None
        
        response_json = response.json()
        
        # Process the response
        if "candidates" in response_json and len(response_json["candidates"]) > 0:
            text_content = response_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            # Extract the JSON data from the response
            try:
                # Find JSON array in text content
                json_start = text_content.find('[')
                json_end = text_content.rfind(']') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = text_content[json_start:json_end]
                    recommendations = json.loads(json_str)
                    
                    # Process recommendations to ensure they have the right fields
                    for product in recommendations:
                        # Ensure URL field exists (map from product_url if needed)
                        if 'product_url' in product and not 'url' in product:
                            product['url'] = product['product_url']
                        elif not 'url' in product:
                            product['url'] = None
                    
                    print(f"Successfully received {len(recommendations)} product recommendations from Gemini")
                    return recommendations
                else:
                    print("Could not find valid JSON in Gemini response.")
                    print("Raw response:", text_content)
                    return None
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from Gemini response: {str(e)}")
                print("Raw response:", text_content)
                return None
        else:
            print("No candidate responses from Gemini API.")
            return None
    
    except Exception as e:
        print(f"Error getting recommendations from Gemini: {str(e)}")
        print(traceback.format_exc())
        return None

def find_image_for_product(product):
    """Get the image URL for a product using its product_url from the dataset"""
    try:
        if 'url' in product and product['url']:
            product_url = product['url']
            print(f"Using product URL for {product['name']}: {product_url}")
            return product_url
        elif 'product_url' in product and product['product_url']:
            product_url = product['product_url']
            print(f"Using product URL for {product['name']}: {product_url}")
            return product_url
        else:
            # Fallback to placeholder if no URL is available
            search_query = f"{product['brand']} {product['name']} skincare product"
            placeholder_url = f"https://via.placeholder.com/300x300.png?text={product['brand']}+{product['name']}"
            
            print(f"No URL available, using placeholder for {product['brand']} {product['name']}")
            return placeholder_url
    except Exception as e:
        print(f"Error finding image for product: {str(e)}")
        return None

def download_image(url, save_path):
    """Download an image from URL, remove background, and save it to the specified path"""
    try:
        # Create a request with a User-Agent header to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        
        # Check if the URL is a LookFantastic product page
        if 'lookfantastic.com' in url and not url.endswith(('.jpg', '.jpeg', '.png', '.gif')):
            print(f"Detected LookFantastic product page, extracting image URL...")
            
            # Method 1: Try to access the product page and extract img src
            try:
                response = requests.get(url, headers=headers, timeout=15)
                
                if response.status_code == 200:
                    html_content = response.text
                    
                    # Look for image tags in the HTML
                    img_urls = []
                    # First look for product images specifically
                    main_img_patterns = [
                        'data-src-desktop="https://static.thcdn.com/p',
                        'src="https://www.lookfantastic.com/images?url=https://static.thcdn.com',
                        'src="https://static.thcdn.com'
                    ]
                    
                    for pattern in main_img_patterns:
                        start_index = 0
                        while True:
                            pattern_start = html_content.find(pattern, start_index)
                            if pattern_start == -1:
                                break
                                
                            # Extract the URL based on pattern
                            if pattern == 'data-src-desktop="https://static.thcdn.com/p':
                                quote_start = pattern_start + len('data-src-desktop="')
                                quote_end = html_content.find('"', quote_start)
                                if quote_end > quote_start:
                                    img_url = html_content[quote_start:quote_end]
                                    img_urls.append(img_url)
                            elif pattern == 'src="https://www.lookfantastic.com/images?url=https://static.thcdn.com':
                                quote_start = pattern_start + len('src="')
                                quote_end = html_content.find('"', quote_start)
                                if quote_end > quote_start:
                                    img_url = html_content[quote_start:quote_end]
                                    # Extract the actual image URL from the parameter
                                    url_param_start = img_url.find("url=") + 4
                                    url_param_end = img_url.find("&", url_param_start)
                                    if url_param_end > url_param_start:
                                        direct_url = img_url[url_param_start:url_param_end]
                                        # URL might be URL encoded
                                        try:
                                            from urllib.parse import unquote
                                            direct_url = unquote(direct_url)
                                            img_urls.append(direct_url)
                                        except:
                                            img_urls.append(direct_url)
                            elif pattern == 'src="https://static.thcdn.com':
                                quote_start = pattern_start + len('src="')
                                quote_end = html_content.find('"', quote_start)
                                if quote_end > quote_start:
                                    img_url = html_content[quote_start:quote_end]
                                    img_urls.append(img_url)
                                    
                            start_index = pattern_start + len(pattern)
                    
                    # If none of the specific patterns worked, fallback to generic img tag parsing
                    if not img_urls:
                        start_idx = 0
                        while True:
                            img_start = html_content.find('<img', start_idx)
                            if img_start == -1:
                                break
                            
                            img_end = html_content.find('>', img_start)
                            if img_end == -1:
                                break
                            
                            img_tag = html_content[img_start:img_end+1]
                            
                            if 'src="' in img_tag:
                                src_start = img_tag.find('src="') + 5
                                src_end = img_tag.find('"', src_start)
                                if src_start > 5 and src_end > src_start:
                                    img_src = img_tag[src_start:src_end]
                                    
                                    # Skip promotional banner images
                                    skip_image = False
                                    if 'brand hasn' in img_tag.lower() or 'banner' in img_tag.lower():
                                        skip_image = True
                                    if 'alt="' in img_tag:
                                        alt_start = img_tag.find('alt="') + 5
                                        alt_end = img_tag.find('"', alt_start)
                                        if alt_end > alt_start:
                                            alt_text = img_tag[alt_start:alt_end].lower()
                                            if "brand hasn't joined" in alt_text or "banner" in alt_text:
                                                skip_image = True
                                    
                                    # Check if it's a product image and not a promotional banner
                                    if not skip_image and ("static.thcdn.com" in img_src):
                                        img_urls.append(img_src)
                                    elif not skip_image and ("lookfantastic.com/images" in img_src and "static.thcdn.com" in img_src):
                                        # Extract the direct thcdn URL
                                        url_param_start = img_src.find("url=") + 4
                                        url_param_end = img_src.find("&", url_param_start)
                                        if url_param_end > url_param_start:
                                            direct_url = img_src[url_param_start:url_param_end]
                                            # URL might be URL encoded
                                            try:
                                                from urllib.parse import unquote
                                                direct_url = unquote(direct_url)
                                                img_urls.append(direct_url)
                                            except:
                                                img_urls.append(direct_url)
                            
                            start_idx = img_end + 1
                    
                    # Method 2: Try to generate image URL from product ID if no images found
                    if not img_urls:
                        try:
                            # Extract the product ID from the URL
                            if '/' in url:
                                parts = url.strip('/').split('/')
                                product_id = parts[-1].split('.')[0]
                                # Try common URL patterns for LookFantastic
                                img_urls.append(f"https://static.thcdn.com/images/large/{product_id}.jpg")
                                img_urls.append(f"https://static.thcdn.com/productimg/1600/1600/{product_id}_L.jpg")
                                img_urls.append(f"https://static.thcdn.com/productimg/original/{product_id}_L.jpg")
                                img_urls.append(f"https://static.thcdn.com/productimg/original/{product_id}-1.jpg")
                        except:
                            pass
                    
                    # Try each image URL until one works
                    for img_url in img_urls:
                        print(f"Trying image URL: {img_url}")
                        try:
                            img_response = requests.get(img_url, headers=headers, timeout=10)
                            if img_response.status_code == 200 and 'image' in img_response.headers.get('Content-Type', ''):
                                # We got a valid image, process it
                                image_data = BytesIO(img_response.content)
                                
                                if REMBG_AVAILABLE:
                                    try:
                                        # Remove background using rembg
                                        print(f"Removing background from image...")
                                        img = Image.open(image_data)
                                        
                                        # Process the image to remove background with more conservative settings
                                        # Use alpha_matting to preserve more of the product edges
                                        try:
                                            output = remove_bg(img, 
                                                              alpha_matting=True, 
                                                              alpha_matting_foreground_threshold=240,
                                                              alpha_matting_background_threshold=10,
                                                              alpha_matting_erode_size=10)
                                        except:
                                            # Fallback to standard removal if advanced options fail
                                            output = remove_bg(img)
                                        
                                        # Save the processed image with transparency
                                        output.save(save_path, format="PNG")
                                        print(f"Background removed and image saved to {save_path}")
                                        return True
                                    except Exception as e:
                                        print(f"Error removing background: {str(e)}")
                                        # Fall back to saving original image if background removal fails
                                        with open(save_path, 'wb') as f:
                                            f.write(img_response.content)
                                        print(f"Saved original image without background removal")
                                        return True
                                else:
                                    # If rembg is not available, save the original image
                                    with open(save_path, 'wb') as f:
                                        f.write(img_response.content)
                                    print(f"Saved image without background removal (rembg not available)")
                                    return True
                        except Exception as e:
                            print(f"Failed to download from {img_url}: {str(e)}")
                    
                    print(f"Could not find any working image URLs for this product")
                    return False
                else:
                    print(f"Failed to access product page: {response.status_code}")
            except Exception as e:
                print(f"Error accessing product page: {str(e)}")
            
            # Method 3: Last resort - try to create a placeholder image
            print("Generating placeholder image for this product")
            try:
                product_name = url.split('/')[-2].replace('-', ' ').title()
                placeholder_url = f"https://via.placeholder.com/500x500.png?text={product_name}"
                placeholder_response = requests.get(placeholder_url, headers=headers, timeout=10)
                if placeholder_response.status_code == 200:
                    with open(save_path, 'wb') as f:
                        f.write(placeholder_response.content)
                    print(f"Created placeholder image for {product_name}")
                    return True
            except:
                pass
            
            return False
        
        # If not a LookFantastic page or direct image URL, just download it normally
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise exception for bad responses
        
        # Check if response is an image
        content_type = response.headers.get('Content-Type', '')
        if 'image' in content_type:
            # Load image from response content
            image_data = BytesIO(response.content)
            
            if REMBG_AVAILABLE:
                try:
                    # Remove background using rembg
                    print(f"Removing background from image...")
                    img = Image.open(image_data)
                    
                    # Process the image to remove background with more conservative settings
                    # Use alpha_matting to preserve more of the product edges
                    try:
                        output = remove_bg(img, 
                                          alpha_matting=True, 
                                          alpha_matting_foreground_threshold=240,
                                          alpha_matting_background_threshold=10,
                                          alpha_matting_erode_size=10)
                    except:
                        # Fallback to standard removal if advanced options fail
                        output = remove_bg(img)
                    
                    # Save the processed image with transparency
                    output.save(save_path, format="PNG")
                    print(f"Background removed and image saved to {save_path}")
                    return True
                except Exception as e:
                    print(f"Error removing background: {str(e)}")
                    # Fall back to saving original image if background removal fails
                    with open(save_path, 'wb') as f:
                        f.write(response.content)
                    print(f"Saved original image without background removal")
                    return True
            else:
                # If rembg is not available, save the original image
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                print(f"Saved image without background removal (rembg not available)")
                return True
        else:
            print(f"URL does not point to an image: {url}")
            return False
    except Exception as e:
        print(f"Error downloading image from {url}: {str(e)}")
        return False

def process_gemini_recommendations(recommendations, recommendations_dir):
    """Process and save product recommendations from Gemini"""
    if not recommendations or len(recommendations) == 0:
        print("No recommendations to process")
        return False
    
    try:
        print("\nPROCESSING PERSONALIZED RECOMMENDATIONS:")
        
        # Group recommendations by category for better organization
        categories = {}
        for product in recommendations:
            category = product.get('category', 'Other').lower()
            if category not in categories:
                categories[category] = []
            categories[category].append(product)
        
        # Process each category
        product_count = 1
        for category, products in categories.items():
            if products:
                print(f"\n{category.upper()}:")
                for product in products:
                    # Display product info
                    print(f"- {product['brand']} {product['name']} (${product['price']})")
                    print(f"  Reason: {product['reason']}")
                    if 'url' in product:
                        print(f"  URL: {product['url']}")
                    
                    # Find and download product image
                    img_url = find_image_for_product(product)
                    if img_url:
                        # Create a unique filename
                        filename = f"rec_{product_count}_{category}_{product['brand']}_{product['name']}.png"
                        # Remove problematic characters from filename
                        filename = "".join(c if c.isalnum() or c in ['_', '.', '-'] else '_' for c in filename)
                        img_path = os.path.join(recommendations_dir, filename)
                        
                        # Download the image and remove background
                        if download_image(img_url, img_path):
                            print(f"  Image saved: recommendations/{filename}")
                        
                    product_count += 1
        
        print("\nProduct recommendations processing complete.")
        return True
    except Exception as e:
        print(f"Error processing recommendations: {str(e)}")
        print(traceback.format_exc())
        return False

def get_gemini_powered_recommendations(skin_type, skin_tone, has_acne, acne_percent, concerns=None):
    """Get recommendations using Gemini's analysis of the skincare dataset"""
    try:
        # Ensure API key is set
        if not GEMINI_API_KEY:
            set_gemini_api_key()
            if not GEMINI_API_KEY:
                return False
        
        # Create recommendations folder if it doesn't exist
        recommendations_dir = os.path.join(ROOT_DIR, "recommendations")
        if not os.path.exists(recommendations_dir):
            os.makedirs(recommendations_dir)
            print(f"Created recommendations folder at {recommendations_dir}")
        
        # Clean up old recommendations
        for filename in os.listdir(recommendations_dir):
            file_path = os.path.join(recommendations_dir, filename)
            if os.path.isfile(file_path):
                os.unlink(file_path)
        
        # Load the skincare dataset
        skincare_df = load_skincare_dataset()
        if skincare_df is None:
            print("Error: Could not load skincare dataset. Using fallback recommendations.")
            return False
        
        # Get personalized recommendations from Gemini
        recommendations = get_gemini_recommendations(
            skincare_df, 
            skin_type, 
            skin_tone, 
            has_acne, 
            acne_percent, 
            concerns
        )
        
        if recommendations:
            # Process and save the recommendations
            success = process_gemini_recommendations(recommendations, recommendations_dir)
            return success
        else:
            print("Could not get recommendations from Gemini. Using fallback recommendations.")
            return False
    
    except Exception as e:
        print(f"Error in recommendation process: {str(e)}")
        print(traceback.format_exc())
        return False

def get_fallback_skincare_recommendations(skin_type, has_acne):
    """Fallback skincare product recommendations if model fails"""
    print("\nRECOMMENDED SKINCARE PRODUCTS:")
    
    # Cleansers
    print("\nCLEANSERS:")
    if skin_type == 'oily' or has_acne:
        print("- CeraVe Foaming Facial Cleanser ($15)")
        print("- La Roche-Posay Effaclar Purifying Foaming Gel ($23)")
    elif skin_type == 'dry':
        print("- CeraVe Hydrating Facial Cleanser ($15)")
        print("- Neutrogena Hydro Boost Hydrating Cleansing Gel ($12)")
    else:
        print("- Cetaphil Gentle Skin Cleanser ($14)")
        print("- Kiehl's Ultra Facial Cleanser ($22)")
    
    # Moisturizers
    print("\nMOISTURIZERS:")
    if skin_type == 'oily':
        print("- Neutrogena Hydro Boost Water Gel ($24)")
        print("- La Roche-Posay Effaclar Mat ($32)")
    elif skin_type == 'dry':
        print("- CeraVe Moisturizing Cream ($19)")
        print("- First Aid Beauty Ultra Repair Cream ($34)")
    elif skin_type == 'combination':
        print("- Clinique Dramatically Different Moisturizing Gel ($30)")
        print("- Belif The True Cream Aqua Bomb ($38)")
    else:
        print("- Neutrogena Oil-Free Moisture ($12)")
        print("- Kiehl's Ultra Facial Cream ($32)")
    
    # Treatments
    print("\nTREATMENTS:")
    if has_acne:
        print("- Paula's Choice 2% BHA Liquid Exfoliant ($30)")
        print("- The Ordinary Niacinamide 10% + Zinc 1% ($6)")
    elif skin_type == 'dry':
        print("- The Ordinary Hyaluronic Acid 2% + B5 ($7)")
        print("- Fresh Rose Deep Hydration Face Cream ($42)")
    elif skin_type == 'combination':
        print("- The Ordinary Azelaic Acid Suspension 10% ($8)")
        print("- Sunday Riley Good Genes All-In-One Lactic Acid Treatment ($85)")
    else:
        print("- Drunk Elephant C-Firma Vitamin C Day Serum ($80)")
        print("- The Ordinary Buffet ($15)")

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description='Skin Analysis with Gemini-Powered Recommendations')
    parser.add_argument('--image', type=str, help='Path to an existing image file')
    parser.add_argument('--concerns', nargs='+', help='Additional skin concerns (e.g., redness pigmentation)', default=[])
    parser.add_argument('--api-key', type=str, help='Google Gemini API key')
    args = parser.parse_args()
    
    print("Starting skin analysis system with Gemini-powered recommendations...")
    
    # Set API key if provided
    global GEMINI_API_KEY
    if args.api_key:
        GEMINI_API_KEY = args.api_key
        print(f"Using Gemini API key from command line arguments")
    
    # Background removal status
    if not REMBG_AVAILABLE:
        print("WARNING: rembg is not available. Background removal will be skipped.")
        print("Try installing it manually with: pip install rembg")
    
    # If no image is provided, look for sample images
    if not args.image:
        # First check images directory
        images_dir = os.path.join(ROOT_DIR, "images")
        if os.path.exists(images_dir):
            for sample_file in ["sample_face.png", "gone.png", "me.png", "suhas1.png", "suhas2.png"]:
                img_path = os.path.join(images_dir, sample_file)
                if os.path.exists(img_path):
                    image_path = img_path
                    print(f"No image provided, using sample image: {image_path}")
                    break
            else:
                # Then check current directory
                for sample_file in ["sample_face.png", "gone.png", "me.png", "suhas1.png"]:
                    if os.path.exists(sample_file):
                        image_path = sample_file
                        print(f"No image provided, using sample image: {image_path}")
                        break
                else:
                    print("ERROR: No image provided and no sample images found.")
                    print("Please provide an image with: python gemini.py --image path/to/image.png")
                    return
        else:
            # Check in current directory
            for sample_file in ["sample_face.png", "gone.png", "me.png", "suhas1.png"]:
                if os.path.exists(sample_file):
                    image_path = sample_file
                    print(f"No image provided, using sample image: {image_path}")
                    break
            else:
                print("ERROR: No image provided and no sample images found.")
                print("Please provide an image with: python gemini.py --image path/to/image.png")
                return
    else:
        # Check if the provided path exists
        if os.path.exists(args.image):
            image_path = args.image
        else:
            # Try to find image in images directory
            alt_path = os.path.join(ROOT_DIR, "images", args.image)
            if os.path.exists(alt_path):
                image_path = alt_path
                print(f"Using image from images directory: {image_path}")
            else:
                print(f"Error: Image file not found at {args.image}")
                return
    
    # Load the image
    image = load_image(image_path)
    if image is None:
        return
    
    # Display the image
    try:
        cv2.imshow("Analysis Image", image)
        cv2.waitKey(2000)  # Show for 2 seconds
    except Exception as e:
        print(f"Warning: Could not display image: {e}")
    
    # Analyze skin
    print("\nAnalyzing skin...\n")
    
    # Get skin tone
    skin_tone, hsv_avg = analyze_skin_tone(image)
    print(f"Detected skin tone: {skin_tone}/6 (where 1 is lightest, 6 is darkest)")
    
    # Get skin type
    skin_type = analyze_skin_type(image)
    print(f"Detected skin type: {skin_type}")
    
    # Check for acne (using 8% threshold)
    has_acne, acne_percent = detect_acne(image)
    print(f"Acne detected: {'Yes' if has_acne else 'No'} ({acne_percent*100:.1f}% redness)")
    
    # Show additional concerns if provided
    if args.concerns:
        print(f"Additional concerns: {', '.join(args.concerns)}")
    
    # Try to get Gemini-powered recommendations
    if not get_gemini_powered_recommendations(skin_type, skin_tone, has_acne, acne_percent, args.concerns):
        print("\nUsing fallback recommendations:")
        # Use fallback recommendations if Gemini fails
        get_fallback_skincare_recommendations(skin_type, has_acne)
    
    # Clean up
    cv2.destroyAllWindows()
    print("\nAnalysis complete!")
    print(f"Recommendation images with removed backgrounds are in: {os.path.join(ROOT_DIR, 'recommendations')}")

if __name__ == "__main__":
    main() 