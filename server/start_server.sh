#!/bin/bash

# Print Python version for debugging
echo "Python version:"
python3 --version
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "pip is not installed. Please install pip and try again."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Uninstall rembg and onnxruntime if they were previously installed
echo "Removing previous packages if they exist..."
pip uninstall -y rembg onnxruntime

# Install required packages
echo "Installing required packages..."
pip install flask flask-cors pillow requests

# Install PyTorch CPU-only version first (necessary for carvekit)
echo "Installing PyTorch CPU-only version..."
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install carvekit for background removal (instead of rembg)
echo "Installing carvekit for background removal..."
pip install carvekit

# Additional dependencies that might be needed
echo "Installing additional dependencies..."
pip install numpy

# Start the server
echo "Starting server..."
cd "$(dirname "$0")"  # Navigate to the directory of this script
python3 app.py 