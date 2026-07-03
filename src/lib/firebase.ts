import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0624562828",
  appId: "1:771158727779:web:704da01f3cb5dbfa51ac56",
  apiKey: "AIzaSyB-HQMQQuGQYkX4ujtjr4fJq-dMJXDnfzQ",
  authDomain: "gen-lang-client-0624562828.firebaseapp.com",
  storageBucket: "gen-lang-client-0624562828.firebasestorage.app",
  messagingSenderId: "771158727779"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
