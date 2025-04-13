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
   - Create a `.env` file in the root directory with the following content:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
   - Replace `your_gemini_api_key_here` with your actual Gemini API key
   - Replace `your_mongodb_connection_string` with your MongoDB connection URI
   - Replace `your_jwt_secret_key` with a secure random string for JWT token signing

## Setting Up the Backend Server

1. Navigate to the server directory:
```bash
cd server
```

2. Install server dependencies:
```bash
npm install
```

3. Start the MongoDB server:
   - If using a local MongoDB installation:
     ```bash
     mongod --dbpath=/path/to/data/directory
     ```
   - If using MongoDB Atlas, make sure your connection string is correctly set in the `.env` file

4. Start the backend server:
```bash
npm run dev
```

The server should start and connect to your MongoDB database. By default, it runs on port 5002.

## Background Removal Server

To enable background removal for product images, you need to run the Flask server:

1. Prerequisites:
   - Python 3.7+ installed
   - pip package manager

2. Start the server:
```bash
cd server
chmod +x start_server.sh
./start_server.sh
```

3. The server will run on `http://localhost:5001` and handle background removal requests from the app.

4. Test the server with:
```bash
curl http://localhost:5001/health
```
Which should return: `{"rembg_available":true,"status":"healthy"}`

> Note: The server uses the `rembg` Python library to remove backgrounds from product images. It runs on port 5001 to avoid conflicts with macOS AirPlay which uses port 5000.

## Running the App

Start the development server:
```bash
npx expo start
```

This will display a QR code in your terminal. Scan this QR code with the Expo Go app on your mobile device to run the application.

### Expo Go App

1. Install the Expo Go app from:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from the terminal with your device's camera (iOS) or directly within the Expo Go app (Android).

## API Configuration

The mobile app connects to the backend server through the `/src/services/api.ts` configuration:

- For iOS simulator: `http://localhost:5002/api`
- For Android emulator: `http://10.0.2.2:5002/api`
- For production: Update with your deployed API URL

## Authentication

The app now includes a complete authentication system with:
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
- `server/` - Backend server code
  - `models/` - MongoDB schemas
  - `routes/` - API endpoints
  - `controllers/` - Business logic
  - `middleware/` - Authentication middleware

## Technologies Used

- React Native
- Expo
- TypeScript
- Google Gemini API
- MongoDB
- Express.js
- JWT Authentication
