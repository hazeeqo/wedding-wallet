import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAfMWQFoIeTmfS_n6zRZvylEswOv9ZrZ-s",
    authDomain: "wedding-tracker-bed3d.firebaseapp.com",
    projectId: "wedding-tracker-bed3d",
    storageBucket: "wedding-tracker-bed3d.appspot.com",
    messagingSenderId: "41981843613",
    appId: "1:41981843613:web:56865dcb2ed976dd905c74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export {
    db,
    storage,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    setDoc,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL
};
