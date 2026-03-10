// src/firebase.js
// ─────────────────────────────────────────────────────────────────
// PASO 1: Ve a https://console.firebase.google.com
// PASO 2: Crea un proyecto → "neuro-music"
// PASO 3: Agrega una app Web (</>)
// PASO 4: Copia tus credenciales aquí abajo
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID",
};

const app       = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
