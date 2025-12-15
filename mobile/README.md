# Project Management Mobile App

A native mobile application for iOS and Android built with React Native and Expo.

## Features

- ✅ User Authentication (Login, Register, Forgot Password)
- ✅ Dashboard with project statistics
- 🚧 Project Management (Coming soon)
- 🚧 Task Management with Kanban board (Coming soon)
- 🚧 Real-time Chat (Coming soon)
- 🚧 Push Notifications (Coming soon)
- 🚧 Team Collaboration (Coming soon)

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo Go app on your mobile device (for testing)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure backend URL:
   - Open `src/constants/config.js`
   - Update `API_BASE_URL` with your backend server URL
   - For testing on a physical device, use your computer's IP address:
     ```javascript
     export const API_BASE_URL = 'http://192.168.1.XXX:5000';
     ```

## Running the App

### Option 1: Using Expo Go (Recommended for Testing)

1. Start the development server:
```bash
npx expo start
```

2. Scan the QR code:
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and scan the QR code

3. The app will load on your device!

### Option 2: Using Android Emulator

1. Install Android Studio and set up an Android emulator
2. Start the emulator
3. Run:
```bash
npx expo start --android
```

### Option 3: Using iOS Simulator (Mac only)

1. Install Xcode
2. Run:
```bash
npx expo start --ios
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── common/      # Button, Input, Card, Loading
│   ├── projects/    # Project-specific components
│   ├── tasks/       # Task-specific components
│   ├── chat/        # Chat components
│   └── notifications/
├── constants/       # Theme, colors, config
├── context/         # React Context for state management
├── navigation/      # Navigation configuration
├── screens/         # App screens
│   ├── auth/       # Login, Register, Forgot Password
│   ├── dashboard/  # Dashboard
│   ├── projects/   # Project screens
│   ├── tasks/      # Task screens
│   ├── chat/       # Chat screen
│   └── profile/    # Profile screens
├── services/        # API services
└── utils/          # Utility functions
```

## Backend Setup

This app connects to the Flask backend from the web version. Make sure your backend is running:

1. Navigate to the backend directory:
```bash
cd "E:\Web Projects\Proj Managment\Proj-Management-main"
```

2. Start the Flask server:
```bash
python run.py
```

3. The backend should be running on `http://localhost:5000`

## Development Tips

### Finding Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network connection.

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address.

### Troubleshooting

1. **Can't connect to backend:**
   - Make sure your phone and computer are on the same WiFi network
   - Update `API_BASE_URL` in `src/constants/config.js` with your computer's IP
   - Check if backend is running

2. **App won't load:**
   - Clear Expo cache: `npx expo start -c`
   - Restart the development server
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **Node version warnings:**
   - The app will still work with Node.js v18
   - For best compatibility, upgrade to Node.js v20 or higher

## Building for Production

### Android APK

```bash
npx expo build:android
```

### iOS IPA (requires Mac)

```bash
npx expo build:ios
```

## Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **Socket.IO Client** - Real-time communication
- **Formik & Yup** - Form validation

## Next Steps

- [ ] Implement project listing and creation
- [ ] Add task management with Kanban board
- [ ] Integrate real-time chat
- [ ] Add push notifications
- [ ] Implement offline support
- [ ] Add more features from the web version

## License

MIT
