import requests
import re
from urllib.parse import quote_plus
from bs4 import BeautifulSoup
import os
import traceback
import base64
from io import BytesIO
from PIL import Image

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
        
        # If no products found through DOM selection, try regex as fallback
        if not product_links:
            print("No products found with BeautifulSoup selectors, trying regex patterns...")
            
            # Multiple regex patterns to find product URLs
            patterns = [
                r'href="(https://www\.lookfantastic\.com[^"]*?/products/[^"]*?)"',
                r'href="(/[^"]*?/products/[^"]*?)"'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, response.text)
                for match in matches:
                    url = match
                    if not url.startswith('http'):
                        url = f"https://www.lookfantastic.com{url}"
                    product_links.append(url)
            
            # Remove duplicates
            product_links = list(set(product_links))
        
        if not product_links:
            print(f"No products found for {brand} {product_name} on LookFantastic")
            return None
        
        # Return the first product link
        return product_links[0]
    
    except Exception as e:
        print(f"Error searching for product: {e}")
        traceback.print_exc()
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
        print(f"Error extracting product image: {e}")
        traceback.print_exc()
        return None

def download_image(url):
    """Download an image and return it as a PIL Image object"""
    try:
        # Skip placeholder images
        if "placeholder.com" in url:
            print(f"Skipping placeholder image")
            return None
            
        # Create a request with a User-Agent header to avoid being blocked
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        
        # Direct download for image URLs
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check if response is successful
        if response.status_code != 200:
            print(f"Failed to download image: {response.status_code}")
            return None
            
        # Check if response is an image
        content_type = response.headers.get('Content-Type', '')
        if 'image' in content_type:
            # Load image from response content
            image = Image.open(BytesIO(response.content))
            return image
        else:
            print(f"URL does not point to an image: {url}")
            return None
    except Exception as e:
        print(f"Error downloading image from {url}: {str(e)}")
        traceback.print_exc()
        return None

def remove_background(image):
    """Remove background from an image using rembg"""
    try:
        # Try to import rembg
        try:
            from rembg import remove
            
            # Process with rembg
            output = remove(image, alpha_matting=True)
            
            # Return the processed image
            return output
        except ImportError:
            print("rembg not installed. Installing...")
            import subprocess
            subprocess.check_call(["pip", "install", "rembg"])
            
            # Try again after installation
            from rembg import remove
            output = remove(image, alpha_matting=True)
            return output
    except Exception as e:
        print(f"Error removing background: {e}")
        traceback.print_exc()
        # Return original image if processing fails
        return image

def find_product_image(product_name, brand, product_type=None):
    """Find a product image for a specific product"""
    product_url = search_product_on_lookfantastic(product_name, brand)
    
    if product_url:
        image_url = get_product_image_from_lookfantastic(product_url)
        if image_url:
            return {"image_url": image_url, "product_url": product_url}
    
    return {"image_url": None, "product_url": None}

def process_product_image(image_url):
    """Download an image and remove the background"""
    if not image_url:
        return None
        
    # Download the image
    image = download_image(image_url)
    if not image:
        return None
        
    # Remove background
    processed_image = remove_background(image)
    if not processed_image:
        return None
        
    # Convert to base64
    buffered = BytesIO()
    processed_image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

# For testing
if __name__ == "__main__":
    # Test the product search and image extraction
    product_name = "Elvive Total Repair 5 Shampoo"
    brand = "L'Oreal"
    
    result = find_product_image(product_name, brand)
    print(f"Found product URL: {result.get('product_url')}")
    print(f"Found image URL: {result.get('image_url')}")
    
    if result.get('image_url'):
        base64_image = process_product_image(result.get('image_url'))
        print(f"Processed image (truncated): {base64_image[:100]}...") 