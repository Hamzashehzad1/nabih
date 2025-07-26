// src/lib/firebase.ts
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "./firebase-config";

let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
}

// @ts-ignore
export { app, auth };