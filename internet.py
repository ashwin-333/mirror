import os
import google.generativeai as genai
from fastai.vision.all import *
import requests
import json
import numpy as np
from PIL import Image
from io import BytesIO
from pathlib import Path
import shutil
import sys
import pandas as pd
import re
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
import time
import random
import tempfile
import gc

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Please set your GEMINI_API_KEY environment variable")
    print("You can get one at: https://ai.google.dev/")
    GEMINI_API_KEY = input("Enter your Gemini API key: ").strip()
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')  # Updated to use stable 1.5 version

# Try CarveKit for much better background removal
CARVEKIT_AVAILABLE = False
try:
    from carvekit.api.high import HiInterface
    from carvekit.api.interface import Interface
    CARVEKIT_AVAILABLE = True
    print("Successfully imported CarveKit for high-quality background removal")
    
    # Initialize CarveKit with optimal settings for product images
    # This uses multiple AI models and ensemble methods for better results
    carvekit_interface = HiInterface(
        object_type="product",  # Optimized for product images
        batch_size_seg=1,       # Process one image at a time for segmentation
        batch_size_matting=1,   # Process one image at a time for matting
        seg_mask_size=640,      # Higher resolution for better detail
        matting_mask_size=2048, # High resolution matting
        trimap_prob_threshold=231, # Default trimap threshold
        trimap_dilation=30,     # Default dilation
        trimap_erosion_iters=5, # Default erosion iterations
        device='cpu',           # Use CPU (change to 'cuda:0' if you have a compatible GPU)
        fp16=False              # Don't use half-precision for CPU
    )
    
except ImportError:
    CARVEKIT_AVAILABLE = False
    print("CarveKit not installed. Will attempt to install it.")
    try:
        import subprocess
        
        # Install dependencies first (torch and torchvision with CPU support)
        print("Installing PyTorch (CPU version)...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "torch", "torchvision", "--index-url", "https://download.pytorch.org/whl/cpu"])
        
        # Install CarveKit
        print("Installing CarveKit...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "carvekit"])
        
        from carvekit.api.high import HiInterface
        from carvekit.api.interface import Interface
        
        # Initialize CarveKit with optimal settings for product images
        carvekit_interface = HiInterface(
            object_type="product",  # Optimized for product images
            batch_size_seg=1,       # Process one image at a time for segmentation
            batch_size_matting=1,   # Process one image at a time for matting
            seg_mask_size=640,      # Higher resolution for better detail
            matting_mask_size=2048, # High resolution matting
            trimap_prob_threshold=231, # Default trimap threshold
            trimap_dilation=30,     # Default dilation
            trimap_erosion_iters=5, # Default erosion iterations
            device='cpu',           # Use CPU (change to 'cuda:0' if you have GPU)
            fp16=False              # Don't use half-precision for CPU
        )
        
        CARVEKIT_AVAILABLE = True
        print("Successfully installed and configured CarveKit")
    except Exception as e:
        print(f"Could not install CarveKit: {str(e)}")
        print("Will proceed with fallback methods")
        
        # Try to install rembg as fallback
        try:
            print("Installing rembg as fallback...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "rembg"])
            from rembg import remove as remove_bg
            print("Using rembg as fallback")
        except:
            print("Failed to install rembg fallback. Background removal will be limited.")

# Install BeautifulSoup if not already installed
try:
    from bs4 import BeautifulSoup
except ImportError:
    print("BeautifulSoup not installed. Will attempt to install it.")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "beautifulsoup4"])
        from bs4 import BeautifulSoup
        print("Successfully installed BeautifulSoup")
    except Exception as e:
        print(f"Could not install BeautifulSoup: {str(e)}")
        print("Some functionality may be limited")

class AlbumentationsTransform(RandTransform):
    "A transform handler for multiple `Albumentation` transforms"
    split_idx, order = None, 2

    def __init__(self, train_aug, valid_aug): store_attr()
    
    def before_call(self, b, split_idx):
        self.idx = split_idx
    
    def encodes(self, img: PILImage):
        if self.idx == 0:
            aug_img = self.train_aug(image=np.array(img))['image']
        else:
            aug_img = self.valid_aug(image=np.array(img))['image']
        return PILImage.create(aug_img)

def get_valid_aug(sz):
    return A.Compose([
        A.Resize(sz, sz)
    ], p=1.)

def predict_hair(img_path):
    try:
        # Load the model
        model_path = 'models/hair-resnet18-model.pkl'
        learn = load_learner(model_path)
        
        # Load and predict on the image - using test_model.py logic
        img = PILImage.create(img_path)
        pred, pred_idx, probs = learn.predict(img)
        
        # Return both prediction and probabilities dictionary
        probabilities = {learn.dls.vocab[i]: float(probs[i]) for i in range(len(learn.dls.vocab))}
        return str(pred), probabilities
    except Exception as e:
        print(f"Error in prediction: {e}")
        return None, None

def get_recommendations(hair_type, dandruff, moisture, hair_density):
    """Get personalized hair product recommendations based on hair attributes"""
    try:
        prompt = (
            f"You are a hair care expert. Based on this profile:\n"
            f"- Hair Type: {hair_type}\n"
            f"- Dandruff: {dandruff}\n"
            f"- Moisture Level: {moisture}\n"
            f"- Hair Density: {hair_density}\n\n"
            f"Recommend 5 specific hair products with these requirements:\n"
            f"1. Each product must be from a different mainstream, well-known brand (like L'Oreal, Pantene, etc.)\n"
            f"2. Include a mix of product types (shampoo, conditioner, serum, etc.)\n"
            f"3. All products should be specific (include full product name and brand)\n"
            f"4. Each product should be available on LookFantastic.com or similar retailers\n\n"
            f"For each product, provide:\n"
            f"1. Exact product name with brand\n"
            f"2. Product type (shampoo, conditioner, etc.)\n"
            f"3. Estimated price range\n"
            f"4. A brief explanation of why it's good for this hair type\n\n"
            f"Format your response as a JSON array with each product having these fields:\n"
            f"- name (full product name including brand)\n"
            f"- brand (just the brand name)\n"
            f"- type (product type/category)\n"
            f"- price_estimate (numeric value only in USD, without currency symbol)\n"
            f"- reason (brief explanation of why this product is good for this hair)\n\n"
            f"Only include the JSON array in your response, nothing else."
        )
        
        # Generate recommendations
        response = model.generate_content(prompt)
        response_text = response.text if hasattr(response, 'text') else response.parts[0].text
        
        # Extract JSON data from the response
        try:
            # Find JSON array in text content
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                recommendations = json.loads(json_str)
                return recommendations
            else:
                print("Could not find valid JSON in Gemini response.")
                print("Raw response:", response_text)
                return None
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from Gemini response: {str(e)}")
            print("Raw response:", response_text)
            return None
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        return None

def search_product_on_lookfantastic(product_name, brand):
    """Search for a product on LookFantastic and return the product URL"""
    try:
        print(f"Searching for {brand} {product_name} on LookFantastic...")
        
        # Format the search query
        search_query = f"{brand} {product_name}"
        search_url = f"https://www.lookfantastic.com/search?q={quote_plus(search_query)}"
        
        # Create headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.lookfantastic.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Send the request
        response = requests.get(search_url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to search LookFantastic: {response.status_code}")
            return None
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find product links
        product_links = []
        product_elements = soup.select('.productBlock')
        
        if not product_elements:
            # Try alternative selectors if the main one doesn't work
            product_elements = soup.select('.productItem')
        
        if not product_elements:
            # Try another alternative selector
            product_elements = soup.select('[data-bind*="product"]')
        
        for product in product_elements:
            link_elem = product.select_one('a[href*="/products/"]')
            if link_elem and 'href' in link_elem.attrs:
                url = link_elem['href']
                # Ensure URL is absolute
                if not url.startswith('http'):
                    url = f"https://www.lookfantastic.com{url}"
                product_links.append(url)
        
        if not product_links:
            print(f"No products found for {brand} {product_name} on LookFantastic")
            return None
        
        # Return the first product link
        return product_links[0]
    
    except Exception as e:
        print(f"Error searching for product: {e}")
        return None

def search_product_on_google(product_name, brand, product_type):
    """Search for a product image using Google"""
    try:
        print(f"Searching for {brand} {product_name} image on Google...")
        
        # Format the search query to explicitly look for product images
        search_query = f"{brand} {product_name} {product_type} product image"
        search_url = f"https://www.google.com/search?q={quote_plus(search_query)}&tbm=isch"
        
        # Create headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Send the request
        response = requests.get(search_url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to search Google: {response.status_code}")
            return None
        
        # Parse the HTML to extract image URLs
        image_urls = []
        
        # Extract image URLs using regex pattern matching (more reliable than parsing)
        pattern = r'https://[^"\']+\.(?:jpg|jpeg|png|webp)'
        matches = re.findall(pattern, response.text)
        
        # Filter out low-quality and thumbnail images
        for url in matches:
            # Skip small thumbnails and icons
            if 'icon' in url.lower() or 'thumb' in url.lower() or 'small' in url.lower():
                continue
            # Skip Google UI images
            if 'google.com' in url:
                continue
            # Keep only product-looking images
            image_urls.append(url)
            # Stop after finding a few good images
            if len(image_urls) >= 3:
                break
        
        if not image_urls:
            print("Could not find any suitable product images on Google")
            return None
        
        # Return the first image URL (usually the most relevant)
        return image_urls[0]
    
    except Exception as e:
        print(f"Error searching Google for product image: {str(e)}")
        return None

def get_product_image_from_lookfantastic(product_url):
    """Extract the product image from a LookFantastic product page"""
    try:
        print(f"Extracting image from {product_url}...")
        
        # Create headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Send the request
        response = requests.get(product_url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Failed to access product page: {response.status_code}")
            return None
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try multiple selectors for product images
        img_urls = []
        
        # Look for main product image
        main_img = soup.select_one('img.athenaProductImageCarousel_image')
        if main_img and 'src' in main_img.attrs:
            img_urls.append(main_img['src'])
        
        # Try data-src attributes for lazy-loaded images
        lazy_imgs = soup.select('img[data-src*="thcdn.com"]')
        for img in lazy_imgs:
            if 'data-src' in img.attrs:
                img_urls.append(img['data-src'])
        
        # Try another common selector pattern
        product_imgs = soup.select('.productImage img')
        for img in product_imgs:
            if 'src' in img.attrs:
                img_urls.append(img['src'])
        
        # Extract image URLs from JSON data in the page
        json_pattern = r'"imageUrl"\s*:\s*"(https:[^"]+)"'
        json_matches = re.findall(json_pattern, response.text)
        img_urls.extend(json_matches)
        
        # Pattern match directly in HTML for specific patterns
        static_patterns = [
            'data-src-desktop="https://static.thcdn.com/p',
            'src="https://www.lookfantastic.com/images?url=https://static.thcdn.com',
            'src="https://static.thcdn.com'
        ]
        
        for pattern in static_patterns:
            start_index = 0
            while True:
                pattern_start = response.text.find(pattern, start_index)
                if pattern_start == -1:
                    break
                
                # Extract the URL based on pattern
                if pattern == 'data-src-desktop="https://static.thcdn.com/p':
                    quote_start = pattern_start + len('data-src-desktop="')
                    quote_end = response.text.find('"', quote_start)
                    if quote_end > quote_start:
                        img_url = response.text[quote_start:quote_end]
                        img_urls.append(img_url)
                elif pattern == 'src="https://www.lookfantastic.com/images?url=https://static.thcdn.com':
                    quote_start = pattern_start + len('src="')
                    quote_end = response.text.find('"', quote_start)
                    if quote_end > quote_start:
                        img_url = response.text[quote_start:quote_end]
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
                    quote_end = response.text.find('"', quote_start)
                    if quote_end > quote_start:
                        img_url = response.text[quote_start:quote_end]
                        img_urls.append(img_url)
                
                start_index = pattern_start + len(pattern)
        
        # Filter out non-product images and duplicates
        filtered_urls = []
        seen = set()
        for url in img_urls:
            # Normalize URL to avoid duplicates
            url = url.strip()
            if url in seen:
                continue
            seen.add(url)
            
            # Skip small thumbnails and UI elements
            if 'icon' in url.lower() or 'thumb' in url.lower() or 'logo' in url.lower():
                continue
            
            # Skip non-image URLs
            if not any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                continue
                
            filtered_urls.append(url)
        
        if not filtered_urls:
            print("Could not find any product images on the page")
            return None
        
        # Return the first high-quality image
        return filtered_urls[0]
    
    except Exception as e:
        print(f"Error extracting product image: {str(e)}")
        return None

def find_product_image(product_name, brand, product_type):
    """Find a high-quality image for a product using multiple sources"""
    # First try LookFantastic
    try:
        # Search for the product on LookFantastic
        product_url = search_product_on_lookfantastic(product_name, brand)
        
        if product_url:
            # Extract the product image from the page
            image_url = get_product_image_from_lookfantastic(product_url)
            
            if image_url:
                print(f"Found image on LookFantastic: {image_url}")
                return image_url, product_url
        
        # If LookFantastic fails, try Google
        print("LookFantastic search failed, trying Google...")
        image_url = search_product_on_google(product_name, brand, product_type)
        
        if image_url:
            print(f"Found image on Google: {image_url}")
            return image_url, None
        
        # If all else fails, return None
        return None, None
    
    except Exception as e:
        print(f"Error finding product image: {str(e)}")
        return None, None

def download_image(url, save_path):
    """Download an image from URL, remove background, and save it to the specified path"""
    try:
        # Skip placeholder images
        if "placeholder.com" in url:
            print(f"Skipping placeholder image")
            return False
            
        # Create a request with a User-Agent header to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        
        # Direct download for image URLs
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check if response is successful
        if response.status_code != 200:
            print(f"Failed to download image: {response.status_code}")
            return False
            
        # Check if response is an image
        content_type = response.headers.get('Content-Type', '')
        if 'image' in content_type:
            # Load image from response content
            image_data = BytesIO(response.content)
            
            # Use CarveKit for better background removal
            if CARVEKIT_AVAILABLE:
                try:
                    print(f"Removing background with CarveKit (high quality)...")
                    
                    # Load the image
                    img = Image.open(image_data)
                    
                    # Check image quality and size
                    # Resize if too large for better processing
                    max_size = 1500
                    if max(img.size) > max_size:
                        ratio = max_size / max(img.size)
                        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                        img = img.resize(new_size, Image.LANCZOS)
                        print(f"Resized image to {new_size} for better processing")
                    
                    # Save to temp file if needed (some CarveKit models require file path)
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                        img.save(tmp.name)
                        tmp_path = tmp.name
                    
                    try:
                        # Process with CarveKit
                        # This uses multiple models and ensemble methods for better results
                        processed_images = carvekit_interface([tmp_path])
                        
                        if processed_images and len(processed_images) > 0:
                            # Get the result and save it
                            result = processed_images[0]
                            result.save(save_path)
                            print(f"Background removed with CarveKit and saved to {save_path}")
                            
                            # Clean up temp file
                            os.unlink(tmp_path)
                            
                            # Free memory (CarveKit can use a lot)
                            del processed_images
                            gc.collect()
                            
                            return True
                    except Exception as e:
                        print(f"Error with CarveKit processing: {e}")
                        # If the temp file exists, clean up
                        if os.path.exists(tmp_path):
                            os.unlink(tmp_path)
                        
                        # Try alternative approach with direct processing
                        print("Trying alternative CarveKit approach...")
                        try:
                            result = carvekit_interface.process_image(img)
                            result.save(save_path)
                            print(f"Background removed with alternative CarveKit method and saved to {save_path}")
                            return True
                        except Exception as e2:
                            print(f"Alternative approach also failed: {e2}")
                            # Fall through to rembg fallback
                            
                except Exception as e:
                    print(f"CarveKit error: {e}")
                    # Continue to fallback methods
                    
            # If CarveKit isn't available or failed, try rembg if available
            try:
                from rembg import remove as remove_bg
                print("Using rembg as fallback...")
                
                # Load the image
                img = Image.open(image_data)
                
                # Process with rembg
                output = remove_bg(img, alpha_matting=True, alpha_matting_foreground_threshold=240)
                
                # Save the result
                output.save(save_path, format="PNG")
                print(f"Background removed with rembg fallback and saved to {save_path}")
                return True
                
            except ImportError:
                print("No background removal libraries available. Saving original image.")
                # Save the original image if all background removal methods fail
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                print(f"Saved original image without background removal")
                return True
                
            except Exception as e:
                print(f"Error with fallback background removal: {e}")
                # Save original image if all attempts fail
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                print(f"Saved original image without background removal")
                return True
        else:
            print(f"URL does not point to an image: {url}")
            return False
    except Exception as e:
        print(f"Error downloading image from {url}: {str(e)}")
        return False

def process_hair_recommendations(recommendations, recommendations_dir):
    """Process and save hair product recommendations with high-quality images"""
    if not recommendations or len(recommendations) == 0:
        print("No recommendations to process")
        return False
    
    try:
        print("\nPROCESSING PERSONALIZED HAIR CARE RECOMMENDATIONS:")
        
        # Group recommendations by type
        types = {}
        for product in recommendations:
            product_type = product.get('type', 'Other').lower()
            if product_type not in types:
                types[product_type] = []
            types[product_type].append(product)
        
        # Process each product type
        product_count = 1
        successful_products = []
        
        for product_type, products in types.items():
            if products:
                print(f"\n{product_type.upper()}:")
                for product in products:
                    # Get product info
                    brand = product.get('brand', 'Unknown')
                    name = product.get('name', 'Unknown Product')
                    price = product.get('price_estimate', 0)
                    
                    print(f"- {brand} {name} (${price})")
                    print(f"  Reason: {product.get('reason', 'No reason provided')}")
                    
                    # Find product image
                    image_url, product_url = find_product_image(name, brand, product_type)
                    
                    if image_url:
                        # Create a unique filename with limited length
                        filename = f"hair_rec_{product_count}_{product_type}_{brand[:20]}.png"
                        # Remove problematic characters from filename
                        filename = "".join(c if c.isalnum() or c in ['_', '.', '-'] else '_' for c in filename)
                        img_path = os.path.join(recommendations_dir, filename)
                        
                        # Download the image and remove background
                        if download_image(image_url, img_path):
                            print(f"  Image saved: recommendations/{filename}")
                            
                            # Store successful product with URL
                            successful_product = product.copy()
                            successful_product['image_url'] = image_url
                            if product_url:
                                successful_product['product_url'] = product_url
                            successful_products.append(successful_product)
                        else:
                            print(f"  Failed to save image for {brand} {name}")
                    else:
                        print(f"  Could not find suitable image for {brand} {name}")
                    
                    # Add a short delay between requests to avoid rate limiting
                    time.sleep(random.uniform(1.0, 2.0))
                    
                    product_count += 1
        
        # Save recommendations data to a JSON file
        if successful_products:
            json_path = os.path.join(recommendations_dir, "recommendations.json")
            with open(json_path, 'w') as f:
                json.dump(successful_products, f, indent=2)
            print(f"\nRecommendations saved to {json_path}")
        
        print("\nHair product recommendations processing complete.")
        return True
    except Exception as e:
        print(f"Error processing recommendations: {str(e)}")
        return False

def main():
    # Create recommendations folder if it doesn't exist
    recommendations_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recommendations")
    if not os.path.exists(recommendations_dir):
        os.makedirs(recommendations_dir)
        print(f"Created recommendations folder at {recommendations_dir}")
    else:
        # Clean existing recommendations
        for file in os.listdir(recommendations_dir):
            file_path = os.path.join(recommendations_dir, file)
            if os.path.isfile(file_path):
                os.unlink(file_path)

    print("\n=== Hair Type Analysis and Product Recommendations ===\n")
    
    # Get image path
    image_path = input("Enter the path to your hair image: ")
    if not Path(image_path).exists():
        print("Error: Image file not found!")
        return

    # Get hair type prediction
    print("\nAnalyzing hair type...")
    hair_type, probabilities = predict_hair(image_path)
    
    if not hair_type:
        print("Could not analyze hair type.")
        return
    
    print(f"\nPredicted Hair Type: {hair_type}")
    if probabilities:
        print("\nConfidence Levels:")
        for type_, prob in probabilities.items():
            print(f"{type_}: {prob*100:.2f}%")
    
    # Get additional information
    print("\nPlease provide additional information:")
    dandruff = input("Dandruff level (None/Light/Medium/Heavy): ")
    moisture = input("Moisture level (Dry/Normal/Oily): ")
    hair_density = input("Hair density (Fine/Medium/Thick): ")

    # Get recommendations
    print("\nGetting 5 product recommendations...")
    recommendations = get_recommendations(hair_type, dandruff, moisture, hair_density)

    if recommendations:
        # Process and save the recommendations with images
        process_hair_recommendations(recommendations, recommendations_dir)
    else:
        print("Could not get recommendations. Please try again.")

if __name__ == "__main__":
    main()