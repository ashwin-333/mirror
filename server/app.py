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

if __name__ == '__main__':
    # Use port 5001 instead of 5000 to avoid conflict with AirPlay on macOS
    port = int(os.environ.get("PORT", 5001))
    # Run the app with threading enabled
    app.run(host='0.0.0.0', port=port, debug=True, threaded=True) 