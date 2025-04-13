from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import requests
from PIL import Image
from io import BytesIO
import base64
import tempfile
import uuid
import sys
import gc
import time
import re
from urllib.parse import quote_plus

# Try to import BeautifulSoup
try:
    from bs4 import BeautifulSoup
    print("Successfully imported BeautifulSoup - web scraping for hair products is available")
    BS4_AVAILABLE = True
except ImportError:
    print("ERROR: BeautifulSoup (bs4) module not found!")
    print("Web scraping for hair products will not work")
    print("Please install it with: pip install beautifulsoup4")
    BS4_AVAILABLE = False

# Try to import carvekit for background removal
CARVEKIT_AVAILABLE = False
try:
    # Import carvekit dependencies
    from carvekit.api.high import HiInterface
    
    # Initialize the carvekit interface with optimized settings for product images
    CARVEKIT_INTERFACE = HiInterface(
        object_type="product",       # Specifically optimized for product images
        batch_size_seg=1,            # Process one image at a time
        batch_size_matting=1,        # Process one image at a time
        seg_mask_size=1024,          # Increased resolution for better detail
        matting_mask_size=2048,      # High resolution matting
        trimap_prob_threshold=250,   # Higher threshold = more conservative (keeps more of product)
        trimap_dilation=5,           # Smaller dilation for finer control around edges
        trimap_erosion_iters=3,      # Adjusted erosion for better edge quality
        device='cpu',                # Use CPU
        fp16=False                   # Full precision for better quality
    )
    
    CARVEKIT_AVAILABLE = True
    print("Successfully imported carvekit for background removal")
except ImportError:
    CARVEKIT_AVAILABLE = False
    print("carvekit not installed. Will attempt to install it.")
    try:
        import subprocess
        
        # Install PyTorch CPU first
        print("Installing PyTorch CPU version...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", 
                              "torch", "torchvision", 
                              "--index-url", "https://download.pytorch.org/whl/cpu"])
        
        # Then install carvekit
        print("Installing carvekit...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "carvekit"])
        
        # Now try importing after installation
        from carvekit.api.high import HiInterface
        
        # Initialize the carvekit interface with optimized settings for product images
        CARVEKIT_INTERFACE = HiInterface(
            object_type="product",       # Specifically optimized for product images
            batch_size_seg=1,            # Process one image at a time
            batch_size_matting=1,        # Process one image at a time
            seg_mask_size=1024,          # Increased resolution for better detail
            matting_mask_size=2048,      # High resolution matting
            trimap_prob_threshold=250,   # Higher threshold = more conservative (keeps more of product)
            trimap_dilation=5,           # Smaller dilation for finer control around edges
            trimap_erosion_iters=3,      # Adjusted erosion for better edge quality
            device='cpu',                # Use CPU
            fp16=False                   # Full precision for better quality
        )
        
        CARVEKIT_AVAILABLE = True
        print("Successfully installed and imported carvekit")
    except Exception as e:
        print(f"Could not install carvekit: {str(e)}")
        print("Will proceed without background removal")
        CARVEKIT_AVAILABLE = False
        
        # Try to install rembg as fallback
        try:
            print("Installing rembg as fallback...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "rembg"])
            from rembg import remove as remove_bg
            print("Using rembg as fallback")
            CARVEKIT_AVAILABLE = True  # We can use rembg instead
        except:
            print("Failed to install rembg fallback. Background removal will be unavailable.")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Create a directory for temp files
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "background_removal_available": CARVEKIT_AVAILABLE})

def optimize_image_for_processing(img, max_size=1200):
    """Resize image if too large for better performance"""
    if max(img.size) > max_size:
        # Calculate new dimensions while maintaining aspect ratio
        ratio = max_size / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        
        # Use LANCZOS for best quality downsampling
        img = img.resize(new_size, Image.LANCZOS)
        print(f"Resized image to {new_size} for better processing")
    
    # Convert to RGB if needed (remove alpha channel if present)
    if img.mode == 'RGBA':
        # Create white background
        background = Image.new('RGB', img.size, (255, 255, 255))
        # Paste image with alpha channel onto white background
        background.paste(img, mask=img.split()[3])
        img = background
        print("Converted RGBA image to RGB for better compatibility")
    elif img.mode != 'RGB':
        img = img.convert('RGB')
        print(f"Converted {img.mode} image to RGB for better compatibility")
    
    # Enhance the image to make product edges clearer
    from PIL import ImageEnhance
    
    # Slightly increase brightness to better separate product
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.05)
    
    # Increase contrast moderately to help with edge detection
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.25)  # Increased contrast for better segmentation
    
    # Sharpen image to improve edge detection
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.8)  # Increased sharpness for clearer edges
    
    return img

@app.route('/remove-background', methods=['POST'])
def remove_background():
    if not CARVEKIT_AVAILABLE:
        return jsonify({"error": "Background removal is not available"}), 500
    
    data = request.json
    if not data or 'imageUrl' not in data:
        return jsonify({"error": "No image URL provided"}), 400
    
    image_url = data['imageUrl']
    print(f"Processing image URL: {image_url}")
    
    try:
        # Download the image with a longer timeout
        response = requests.get(image_url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }, timeout=20)
        response.raise_for_status()
        
        # Check if response is an image
        content_type = response.headers.get('Content-Type', '')
        print(f"Content type: {content_type}")
        
        if 'image' not in content_type:
            # Sometimes content type can be wrong or missing, try to load as image anyway
            try:
                image_data = BytesIO(response.content)
                Image.open(image_data)
                print("Successfully opened image despite content type mismatch")
                # If it opens as an image, proceed anyway
            except Exception as img_error:
                print(f"Failed to open as image: {str(img_error)}")
                return jsonify({"error": f"URL does not point to an image: {content_type}"}), 400
        
        # Load image from response content
        image_data = BytesIO(response.content)
        img = Image.open(image_data)
        print(f"Image loaded successfully: {img.format} {img.mode} {img.size}")
        
        # Optimize image before processing
        img = optimize_image_for_processing(img)
        
        # Record processing start time
        start_time = time.time()
        
        # Remove background using available method
        print(f"Removing background from image...")
        try:
            # Save to temp file if needed (some models require file path)
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                img.save(tmp.name)
                tmp_path = tmp.name
                print(f"Saved input image to temporary file: {tmp_path}")
            
            output_img = None
            
            # First try: Process with carvekit through file path if available
            if 'CARVEKIT_INTERFACE' in globals():
                try:
                    print("Processing with CarveKit...")
                    # Process with CarveKit through file path
                    processed_images = CARVEKIT_INTERFACE([tmp_path])
                    
                    if processed_images and len(processed_images) > 0:
                        # Get the result
                        output_img = processed_images[0]
                        
                        # Free memory
                        del processed_images
                        gc.collect()
                        print(f"CarveKit processing completed in {time.time() - start_time:.2f} seconds")
                    else:
                        raise Exception("CarveKit returned empty result")
                
                except Exception as e:
                    print(f"First CarveKit method failed: {str(e)}")
                    
                    # Try alternative approach with direct processing
                    try:
                        print("Trying alternative CarveKit approach...")
                        output_img = CARVEKIT_INTERFACE.process_image(img)
                        print(f"Alternative CarveKit processing completed in {time.time() - start_time:.2f} seconds")
                    except Exception as e2:
                        print(f"Alternative CarveKit approach failed: {str(e2)}")
                        
                        # Try one more option with alpha matting if previous attempts failed
                        try:
                            print("Trying direct processing with custom settings...")
                            from carvekit.api.interface import Interface
                            from carvekit.ml.wrap.u2net import U2NET
                            from carvekit.trimap.generator import TrimapGenerator
                            from carvekit.ml.wrap.fba_matting import FBAMatting
                            
                            # Custom segmentation model
                            seg_model = U2NET(device='cpu', batch_size=1)
                            # Custom trimap generator
                            trimap_generator = TrimapGenerator(prob_threshold=230, 
                                                             kernel_size=15, 
                                                             erosion_iters=3)
                            # Custom matting model
                            matting_model = FBAMatting(device='cpu', batch_size=1, 
                                                     input_tensor_size=2048,
                                                     ram_efficient=True)
                            
                            # Create a custom interface with our tuned parameters
                            interface = Interface(seg_model, matting_model, trimap_generator)
                            
                            # Process the image with our custom interface
                            output_img = interface.process_image(img)
                            print(f"Custom processing completed in {time.time() - start_time:.2f} seconds")
                        except Exception as e3:
                            print(f"Custom processing approach failed: {str(e3)}")
                            raise e2
            
            # Second try: Use rembg if available
            elif 'remove_bg' in globals():
                print("Using rembg for background removal...")
                # Use alpha matting for better edge quality
                output_img = remove_bg(img, 
                                      alpha_matting=True, 
                                      alpha_matting_foreground_threshold=240,
                                      alpha_matting_background_threshold=20,
                                      alpha_matting_erode_size=15)
                print(f"Rembg processing completed in {time.time() - start_time:.2f} seconds")
            
            else:
                # Clean up temp file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
                return jsonify({"error": "No background removal method available"}), 500
            
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
            if output_img is None:
                return jsonify({"error": "Background removal failed - no output image generated"}), 500
            
            # Post-processing for cleaned up edges
            output_img = post_process_alpha(output_img)
            
            print("Background removal successful")
            
            # Save the processed image to a temporary file
            unique_id = str(uuid.uuid4())
            temp_file_path = os.path.join(TEMP_DIR, f"{unique_id}.png")
            output_img.save(temp_file_path, format="PNG")
            print(f"Saved output image to {temp_file_path}")
            
            # Convert to base64 for response
            buffered = BytesIO()
            output_img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            # Free memory
            del output_img
            del img
            gc.collect()
            
            print(f"Total processing time: {time.time() - start_time:.2f} seconds")
            
            return jsonify({
                "success": True,
                "base64Image": f"data:image/png;base64,{img_str}"
            })
        
        except Exception as proc_error:
            print(f"Background removal failed: {str(proc_error)}")
            return jsonify({"error": f"Background removal processing error: {str(proc_error)}"}), 500
            
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Post-processing for cleaned up edges
def post_process_alpha(output_img):
    """Apply post-processing to improve alpha channel quality"""
    if output_img.mode == 'RGBA':
        # Split channels
        r, g, b, a = output_img.split()
        
        # Clean up the alpha channel
        from PIL import ImageFilter
        
        # Remove noise in the alpha channel with a slight blur
        a = a.filter(ImageFilter.GaussianBlur(radius=0.3))
        
        # Apply a threshold to make edges cleaner
        from PIL import ImageOps
        a = ImageOps.autocontrast(a, cutoff=1)
        
        # Reassemble the image
        processed_img = Image.merge('RGBA', (r, g, b, a))
        return processed_img
    
    return output_img

@app.route('/api/hair/search-product', methods=['POST'])
def search_hair_product():
    """API endpoint to search for a HAIR product on LookFantastic using BeautifulSoup"""
    if not BS4_AVAILABLE:
        return jsonify({
            "success": False,
            "message": "BeautifulSoup is not installed on the server. Hair product search is not available."
        }), 503
        
    try:
        data = request.json
        if not data or 'name' not in data or 'brand' not in data:
            return jsonify({"error": "Product name and brand are required"}), 400
            
        product_name = data['name']
        brand = data['brand']
        product_type = data.get('type', '')  # Optional
        
        # Only allow hair-related products to use this endpoint
        if not ('hair' in product_type.lower() or 
                'shampoo' in product_type.lower() or 
                'conditioner' in product_type.lower()):
            return jsonify({
                "success": False,
                "message": "This endpoint is for hair products only"
            }), 400
        
        print(f"Searching for hair product: {brand} {product_name}")
        
        # First try LookFantastic
        product_url = search_product_on_lookfantastic(product_name, brand)
        image_url = None
        
        if product_url:
            # Extract the product image from the page
            image_url = get_product_image_from_lookfantastic(product_url)
        
        # If LookFantastic doesn't have it, try Google
        if not image_url:
            image_url = search_product_on_google(product_name, brand, product_type)
            product_url = None  # We don't have a product URL from Google search
            
        if image_url:
            print(f"Found hair product image: {image_url}")
            if product_url:
                print(f"Product URL: {product_url}")
            return jsonify({
                "success": True,
                "image_url": image_url,
                "product_url": product_url
            })
                
        return jsonify({
            "success": False,
            "message": f"No image found for {brand} {product_name}"
        }), 404
            
    except Exception as e:
        print(f"Error searching for hair product: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/hair/process-product-image', methods=['POST'])
def process_hair_product_image():
    """API endpoint to download and process a HAIR product image using BeautifulSoup"""
    if not BS4_AVAILABLE:
        return jsonify({
            "success": False,
            "message": "BeautifulSoup is not installed on the server. Hair product image processing is not available."
        }), 503
        
    try:
        data = request.json
        if not data or 'image_url' not in data:
            return jsonify({"error": "Image URL is required"}), 400
            
        image_url = data['image_url']
        
        # Only allow hair-related products to use this endpoint
        if not ('hair' in image_url.lower() or 
                'shampoo' in image_url.lower() or 
                'conditioner' in image_url.lower()):
            return jsonify({
                "success": False,
                "message": "This endpoint is for hair product images only"
            }), 400
            
        print(f"Processing hair product image: {image_url}")
        
        # Download and process the image
        processed_image = download_and_process_product_image(image_url)
        
        if processed_image:
            return jsonify({
                "success": True,
                "base64Image": processed_image
            })
        else:
            return jsonify({
                "success": False,
                "message": "Failed to process hair product image"
            }), 404
            
    except Exception as e:
        print(f"Error processing hair product image: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Function to search for a product on LookFantastic
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
        response = requests.get(search_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"Failed to search LookFantastic: {response.status_code}")
            return None
        
        # Parse the HTML with BeautifulSoup (exactly like internet.py)
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
        import traceback
        traceback.print_exc()
        return None

# Function to search for product images on Google
def search_product_on_google(product_name, brand, product_type=""):
    """Search for a product image using Google"""
    try:
        print(f"LookFantastic search failed, trying Google...")
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
        response = requests.get(search_url, headers=headers, timeout=10)
        
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
        
        print(f"Found image on Google: {image_urls[0]}")
        return image_urls[0]
    
    except Exception as e:
        print(f"Error searching Google for product image: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# Function to extract the product image from a LookFantastic product page
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
        response = requests.get(product_url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"Failed to access product page: {response.status_code}")
            return None
        
        # Parse HTML with BeautifulSoup (exactly like internet.py)
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
        print(f"Error extracting product image: {e}")
        import traceback
        traceback.print_exc()
        return None

# Function to download and remove background from a product image
def download_and_process_product_image(image_url):
    """Download an image and remove the background"""
    try:
        # Skip placeholder images
        if "placeholder.com" in image_url:
            print(f"Skipping placeholder image")
            return None
            
        # Create a request with a User-Agent header to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        
        # Direct download for image URLs
        response = requests.get(image_url, headers=headers, timeout=10)
        
        # Check if response is successful
        if response.status_code != 200:
            print(f"Failed to download image: {response.status_code}")
            return None
            
        # Check if response is an image
        content_type = response.headers.get('Content-Type', '')
        if 'image' in content_type:
            # Load image from response content
            image_data = BytesIO(response.content)
            
            try:
                # First try carvekit if available
                if CARVEKIT_AVAILABLE and 'CARVEKIT_INTERFACE' in globals():
                    print(f"Removing background with CarveKit...")
                    
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
                    
                    # Save to temp file (carvekit requires file path)
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                        img.save(tmp.name)
                        tmp_path = tmp.name
                    
                    # Process with CarveKit
                    processed_images = CARVEKIT_INTERFACE([tmp_path])
                    
                    if processed_images and len(processed_images) > 0:
                        # Get the result
                        result = processed_images[0]
                        
                        # Convert to base64
                        buffered = BytesIO()
                        result.save(buffered, format="PNG")
                        img_str = base64.b64encode(buffered.getvalue()).decode()
                        
                        # Clean up temp file
                        os.unlink(tmp_path)
                        
                        # Free memory
                        del processed_images
                        gc.collect()
                        
                        print(f"Background removed successfully with CarveKit")
                        return f"data:image/png;base64,{img_str}"
                
                # Try rembg if available
                try:
                    from rembg import remove as remove_bg
                    print("Using rembg for background removal...")
                    
                    # Load the image
                    img = Image.open(image_data)
                    
                    # Process with rembg
                    output = remove_bg(img, alpha_matting=True, alpha_matting_foreground_threshold=240)
                    
                    # Convert to base64
                    buffered = BytesIO()
                    output.save(buffered, format="PNG")
                    img_str = base64.b64encode(buffered.getvalue()).decode()
                    
                    print(f"Background removed successfully with rembg")
                    return f"data:image/png;base64,{img_str}"
                except ImportError:
                    print("No background removal libraries available. Saving original image.")
            
            except Exception as e:
                print(f"Error with background removal: {e}")
                import traceback
                traceback.print_exc()
            
            # If all background removal methods fail, return original image
            img = Image.open(image_data)
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            print(f"Returning original image without background removal")
            return f"data:image/png;base64,{img_str}"
        else:
            print(f"URL does not point to an image: {content_type}")
            return None
    except Exception as e:
        print(f"Error downloading image from {image_url}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    # Use port 5001 instead of 5000 to avoid conflict with AirPlay on macOS
    port = 5001
    # Run the app with threading enabled
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True) 