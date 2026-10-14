import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBVXxej5X7jhCuLtb04m3tibgQmbiQQqNo",
  authDomain: "dreamlifemx.firebaseapp.com",
  projectId: "dreamlifemx",
  storageBucket: "dreamlifemx.firebasestorage.app",
  messagingSenderId: "45484331160",
  appId: "1:45484331160:web:71f1644570aa92c56d80ed",
  measurementId: "G-PB3LS7CX7C"
};

export const firebaseProjectId = firebaseConfig.projectId;
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
