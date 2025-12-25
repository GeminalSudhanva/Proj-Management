// Firebase configuration for Project Management Mobile App
// Using Firebase v9 compat mode for better Expo Go compatibility

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from google-services.json
const firebaseConfig = {
    apiKey: "AIzaSyDRDk5QTapNyv6PvoVPEPDCCTnEsD_7ULM",
    authDomain: "project-management-mobil-b5953.firebaseapp.com",
    projectId: "project-management-mobil-b5953",
    storageBucket: "project-management-mobil-b5953.firebasestorage.app",
    messagingSenderId: "935100277148",
    appId: "1:935100277148:android:af74f85c60d3b1c982e859",
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// Enable persistence with AsyncStorage for React Native
// This keeps users logged in between app restarts
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
    console.warn('Auth persistence error:', error);
});

export { firebase, auth };
export default firebase;
