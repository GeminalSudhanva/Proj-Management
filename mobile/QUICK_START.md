# 🚀 Quick Start Guide - React Native Mobile App

## ✅ What's Been Built

Your React Native mobile app is now running! Here's what's ready:

### Completed Features:
- ✅ **Project Setup**: Expo React Native app initialized
- ✅ **Navigation**: Auth stack and App stack with bottom tabs
- ✅ **Authentication Screens**:
  - Login screen with email/password
  - Registration screen
  - Forgot Password screen
- ✅ **Dashboard**: Welcome screen with stats (placeholder)
- ✅ **UI Components**: Button, Input, Card, Loading
- ✅ **State Management**: AuthContext for authentication
- ✅ **API Integration**: Axios client with interceptors
- ✅ **Storage**: AsyncStorage for tokens and user data

---

## 📱 How to View the App on Your Phone

### Step 1: Download Expo Go
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Scan the QR Code
The development server is running and showing a QR code in your terminal.

- **iOS**: Open your Camera app and point it at the QR code
- **Android**: Open the Expo Go app and tap "Scan QR Code"

### Step 3: Wait for the App to Load
The app will download and open on your device!

---

## 🔧 Important: Backend Connection

**The app needs to connect to your Flask backend!**

### Option 1: USB Connection (Recommended for now)
Since you asked about USB, you can use USB debugging:

**For Android:**
1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect via USB
4. Run: `npx expo start --localhost`

### Option 2: Same WiFi Network (Easier)
1. Make sure your phone and computer are on the **same WiFi network**
2. Find your computer's IP address:
   - Windows: Run `ipconfig` in terminal
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

3. Update the backend URL:
   - Open: `E:\Web Projects\Proj Managment\Proj-Management-Mobile\src\constants\config.js`
   - Change line 3 to your computer's IP:
     ```javascript
     export const API_BASE_URL = 'http://192.168.1.XXX:5000';
     ```
   - Replace XXX with your actual IP

4. Make sure your Flask backend is running:
   ```bash
   cd "E:\Web Projects\Proj Managment\Proj-Management-main"
   python run.py
   ```

---

## 🎯 Testing the App

### What You Can Test Now:
1. **Registration**: Create a new account
2. **Login**: Sign in with your credentials
3. **Dashboard**: View the welcome screen
4. **Logout**: Sign out and return to login

### Current Limitations:
- Projects, tasks, chat, and notifications are placeholders
- Need to build those screens next (coming soon!)

---

## 🐛 Troubleshooting

### App won't load on phone:
- Make sure Expo Go is installed
- Check that you're scanning the correct QR code
- Try pressing `r` in the terminal to reload

### Can't connect to backend:
- Verify backend is running on port 5000
- Check that phone and computer are on same WiFi
- Update `API_BASE_URL` with correct IP address
- Check firewall settings (allow port 5000)

### App crashes on login:
- This is expected if backend isn't configured yet
- The Flask app uses session-based auth, we may need to adapt it for mobile

---

## 📋 Next Steps

To complete the app, we need to build:
1. **Project Management**: List, create, view, edit projects
2. **Task Management**: Kanban board, create/edit tasks
3. **Real-time Chat**: Socket.IO integration
4. **Notifications**: Push notifications
5. **Team Collaboration**: Invitations, team members

Would you like me to continue building these features?

---

## 💡 Tips

- **Shake your phone** to open the developer menu
- **Press `r`** in terminal to reload the app
- **Press `j`** in terminal to open Chrome debugger
- **Press `Ctrl+C`** in terminal to stop the server

---

## 📞 Current Status

✅ **Development server is RUNNING**
✅ **QR code is displayed** - scan it with your phone!
✅ **App is ready for live preview**

The terminal shows:
```
Metro waiting on exp://192.168.1.32:8081
Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**You can now see the app on your phone in real-time!** Any changes you make to the code will automatically reload on your device.
