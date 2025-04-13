# Mirror

Welcome to Mirror, a mobile application to get skin and hair product recommendations!

## Getting started

> **Prerequisites:**
> The following steps require [Node.js](https://nodejs.org/en/) to be installed on your system.
> You'll also need [Expo Go](https://expo.dev/client) on your mobile device for testing.

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
   ```
   - Replace `your_gemini_api_key_here` with your actual Gemini API key

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

## Technologies Used

- React Native
- Expo
- TypeScript
- Google Gemini API
