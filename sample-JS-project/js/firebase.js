import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0hl-94d_q0pc3hsrSxqh5lNfLaMPuMQs",
  authDomain: "emotioninmotion-d09e3.firebaseapp.com",
  projectId: "emotioninmotion-d09e3",
  storageBucket: "emotioninmotion-d09e3.firebasestorage.app",
  messagingSenderId: "696714642190",
  appId: "1:696714642190:web:641123ef1857eb947d0d5f",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
