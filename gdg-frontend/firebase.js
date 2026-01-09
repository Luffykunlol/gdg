import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCX4EfmAFlUhDgUylCcqkSE_hkKuSzk3sM",
  authDomain: "civic-shield.firebaseapp.com",
  projectId: "civic-shield",
  storageBucket: "civic-shield.firebasestorage.app",
  messagingSenderId: "648215506380",
  appId: "1:648215506380:web:b29ef308d8d6d0a782c169"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
