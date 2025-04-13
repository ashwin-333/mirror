# Mirror

Welcome to Mirror, a mobile application to get skin and hair product recommendations!

## Getting started

> **Prerequisites:**
> The following steps require [Node.js](https://nodejs.org/en/) to be installed on your system.
> You'll also need [Expo Go](https://expo.dev/client) on your mobile device for testing.
> For the backend server, you'll need [MongoDB](https://www.mongodb.com/try/download/community) installed locally or access to a MongoDB Atlas account.

## Installation

1. Clone this repository:
```bash
git clone https://github.com/ashwin-333/mirror.git
cd mirror
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory by copying the example file:
   ```bash
   cp .env.example .env
   ```
   - Edit the `.env` file with your specific settings:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5002
   DEVELOPER_IP=your_ip_address
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Finding Your IP Address

To find your IP address:

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
The output will show your IP address, typically something like `192.168.1.100` or `10.0.0.174`.

**On Windows:**
```bash
ipconfig
```
Look for the "IPv4 Address" under your active network adapter. 

## Running All Services

### 1. Start the Backend Server (MongoDB API)

Navigate to the backend directory and start the server:
```bash
cd backend
npm run dev
```

The server should start and connect to your MongoDB database. It will run on port 5002 by default and will be accessible from your physical device.

### 2. Start the ML Model Server (Optional)

If you need the machine learning model server for recommendations:
```bash
cd server
./start_server.sh
```

### 3. Start the React Native App

In a new terminal, start the Expo development server:
```bash
npm start
```

This will display a QR code in your terminal. Scan this QR code with the Expo Go app on your mobile device to run the application.

### Expo Go App

1. Install the Expo Go app from:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from the terminal with your device's camera (iOS) or directly within the Expo Go app (Android).

## Troubleshooting Network Issues

If your physical device cannot connect to the server:

1. **Double check your IP address** - Your computer's IP might change when switching networks. Update the `DEVELOPER_IP` in your `.env` file when this happens.

2. **Firewall settings** - Make sure your firewall allows connections on the port (default: 5002).

3. **Same network** - Ensure your phone and computer are on the same network.

4. **Restart servers** - Sometimes, restarting the backend server and Expo server can resolve connectivity issues.

## Authentication

The app includes a complete authentication system with:
- User registration
- Login/logout functionality
- JWT-based authentication
- Protected routes

## Building for Production

Create a production build:
```bash
expo build:android  # For Android
expo build:ios      # For iOS
npx expo export:web # For web
```

## Project Structure

- `assets/` - Contains images, fonts, and other static assets
- `src/` - Source code for the application
  - `components/` - Reusable UI components
  - `screens/` - App screens
  - `context/` - Context providers including AuthContext
  - `services/` - API service configurations
- `backend/` - MongoDB backend server code
  - `models/` - MongoDB schemas
  - `routes/` - API endpoints
  - `controllers/` - Business logic
  - `middleware/` - Authentication middleware
- `server/` - Machine learning model server for recommendations

## Technologies Used

- React Native
- Expo
- TypeScript
- Google Gemini API
- MongoDB
- Express.js
- JWT Authentication
