import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyDry4MZpRy2wMJD9Q8Xxznb77dEvQoRUBc",
    authDomain: "todolist-3e2b2.firebaseapp.com",
    projectId: "todolist-3e2b2",
    storageBucket: "todolist-3e2b2.firebasestorage.app",
    messagingSenderId: "297379190952",
    appId: "1:297379190952:web:491fda3c47e715ebbc4a9d",
    measurementId: "G-HHQPM2238H"
  };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
