#!/bin/bash

# Script to help set up the Mirror application environment

echo "Mirror App Setup Script"
echo "======================="
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
else
  echo ".env file already exists."
fi

# Find the local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  IP=$(hostname -I | awk '{print $1}')
else
  # Windows with Git Bash or other systems - user needs to enter IP manually
  IP=""
fi

if [ -z "$IP" ]; then
  echo "Could not automatically determine your IP address."
  read -p "Please enter your computer's IP address: " IP
else
  echo "Found your IP address: $IP"
  read -p "Would you like to use this IP address? (y/n): " CONFIRM
  if [ "$CONFIRM" != "y" ]; then
    read -p "Please enter your computer's IP address: " IP
  fi
fi

# Update the .env file with the IP address
if grep -q "DEVELOPER_IP=" .env; then
  # If DEVELOPER_IP exists, update it
  sed -i.bak "s/DEVELOPER_IP=.*/DEVELOPER_IP=$IP/" .env && rm .env.bak
else
  # If DEVELOPER_IP doesn't exist, add it
  echo "DEVELOPER_IP=$IP" >> .env
fi

echo "Your .env file has been updated with IP: $IP"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Provide instructions
echo ""
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the backend server: cd backend && npm run dev"
echo "2. Start the model server (in another terminal): cd server && ./start_server.sh"
echo "3. Start the Expo app (in another terminal): npm start"
echo ""
echo "For more details, please refer to the README.md file." 