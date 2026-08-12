// database.js — everything combined into one file
// Works directly in the browser via <script type="module" src="database.js"></script>
// No npm/bundler needed — Firebase is loaded from the CDN, and browsers
// natively support import/export between your own local .js files.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js";

// ---------- Firebase init ----------
const firebaseConfig = {
  apiKey: "AIzaSyCMOsk4HMvIRvQRzB-IXq6Z8EmYJq4rI3Q",
  authDomain: "onecare-2dbc8.firebaseapp.com",
  projectId: "onecare-2dbc8",
  storageBucket: "onecare-2dbc8.firebasestorage.app",
  messagingSenderId: "880131894731",
  appId: "1:880131894731:web:8c344e105366a5a1d5da4e",
  measurementId: "G-BSTRV519XB"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// ---------- Patient ----------

function generateUserId(length = 20) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  let id = "";
  for (let i = 0; i < length; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}

export async function createPatient(patientData) {
  const userId = generateUserId();
  await setDoc(doc(db, "patients", userId), {
    ...patientData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return userId;
}
export async function getPatient(patientId) {
  const snap = await getDoc(doc(db, "patients", patientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
export async function updatePatient(patientId, updates) {
  return await updateDoc(doc(db, "patients", patientId), { ...updates, updatedAt: serverTimestamp() });
}

// ---------- Generic subcollections ----------
function subRef(patientId, name) { return collection(db, "patients", patientId, name); }
export async function addEntry(patientId, name, data) {
  return await addDoc(subRef(patientId, name), { ...data, createdAt: serverTimestamp() });
}
export async function getEntries(patientId, name) {
  const snapshot = await getDocs(subRef(patientId, name));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
export async function updateEntry(patientId, name, entryId, updates) {
  return await updateDoc(doc(db, "patients", patientId, name, entryId), updates);
}
export async function deleteEntry(patientId, name, entryId) {
  return await deleteDoc(doc(db, "patients", patientId, name, entryId));
}
export const getMedicalHistory = (id) => getEntries(id, "medicalHistory");
export const addMedicalHistoryEntry = (id,
