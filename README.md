# Mirror

Welcome to Mirror, a mobile application for virtual try-on and beauty experimentation!

## Getting started

> **Prerequisites:**
> The following steps require [Node.js](https://nodejs.org/en/) to be installed on your system.
> You'll also need [Expo CLI](https://docs.expo.dev/get-started/installation/) for development.

## Installation

1. Clone this repository:
```bash
git clone https://github.com/tejaspolu/mirror.git
cd mirror
```

2. Install dependencies:
```bash
npm install
```

3. Install Expo CLI globally (if not already installed):
```bash
npm install -g expo-cli
```

## Running the App

### Development Mode

Start the development server:
```bash
npx expo start
```

This will open a new browser window with the Expo DevTools. From there, you can:

- Press `a` to run on an Android emulator or device
- Press `i` to run on an iOS simulator or device
- Press `w` to run in a web browser
- Scan the QR code with the Expo Go app on your phone

### Running on a Physical Device

1. Install the Expo Go app from:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code from the terminal or Expo DevTools with your device's camera (iOS) or the Expo Go app (Android).

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
