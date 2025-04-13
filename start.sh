#!/bin/bash

# Get the IP address of the machine
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP_ADDRESS=$(ipconfig getifaddr en0)
    if [ -z "$IP_ADDRESS" ]; then
        IP_ADDRESS=$(ipconfig getifaddr en1)
    fi
else
    # Linux
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
fi

echo "Found IP address: $IP_ADDRESS"

# Update the skinAnalysis.ts file with the correct IP address
echo "Updating skinAnalysis.ts with IP address..."
sed -i.bak "s|http://[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+:5001|http://$IP_ADDRESS:5001|g" src/utils/skinAnalysis.ts
rm -f src/utils/skinAnalysis.ts.bak

# Install rembg in server
echo "Installing rembg in server..."
cd server
./start_server.sh &
server_pid=$!
cd ..

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s "http://$IP_ADDRESS:5001/health" > /dev/null; then
    echo "Failed to start server. Check server logs for details."
    kill $server_pid
    exit 1
fi

# Start the Expo app
echo "Starting Expo app..."
npx expo start 