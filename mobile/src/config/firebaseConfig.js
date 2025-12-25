// Firebase configuration for Project Management Mobile App
// Using Firebase v9 compat mode for better Expo Go compatibility

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

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

// Note: Firebase compat mode handles persistence automatically in React Native
// No need to manually set persistence

export { firebase, auth };
export default firebase;

