// Works directly in the browser via <script type="module" src="database.js"></script>
// No npm/bundler needed — Firebase is loaded from the CDN, and browsers
// natively support import/export between your own local .js files.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";
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

// ---------- Auth ----------
// Creates a real Firebase Auth account AND the matching patient document,
// using the auth uid as the patient document's ID. That means getPatient(uid)
// works directly with no query, and it's impossible for the doc's ownerId to
// end up out of sync with who actually owns it.
export async function registerPatient(email, password, patientData) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  if (patientData?.firstName || patientData?.lastName) {
    await updateProfile(credential.user, {
      displayName: [patientData.firstName, patientData.lastName].filter(Boolean).join(" "),
    });
  }

  await setDoc(doc(db, "patients", uid), {
    ...patientData,
    ownerId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return uid;
}

export async function loginPatientAccount(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutPatientAccount() {
  return await signOut(auth);
}

// Fires immediately with the current user (or null), then again on every
// sign-in/sign-out. Use this instead of checking sessionStorage flags, since
// it reflects real Firebase Auth state and survives page reloads correctly.
export function onPatientAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

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
    // Ties this record to whoever is logged in. Your Firestore rules should
    // require ownerId == request.auth.uid for reads/writes to this doc and
    // its subcollections — otherwise a guessed/leaked patientId is enough
    // to access someone's medical + insurance data.
    ownerId: auth.currentUser ? auth.currentUser.uid : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return userId;
}

// Look up the patient record belonging to the currently logged-in user
// (or a given uid), instead of trusting a stored/passed-around patientId.
export async function getPatientByOwner(ownerUid = auth.currentUser?.uid) {
  if (!ownerUid) return null;
  const q = query(collection(db, "patients"), where("ownerId", "==", ownerUid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getPatient(patientId) {
  const snap = await getDoc(doc(db, "patients", patientId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updatePatient(patientId, updates) {
  return await updateDoc(doc(db, "patients", patientId), { ...updates, updatedAt: serverTimestamp() });
}

export async function deletePatient(patientId) {
  return await deleteDoc(doc(db, "patients", patientId));
}

// ---------- Generic subcollections ----------
function subRef(patientId, name) {
  return collection(db, "patients", patientId, name);
}

export async function addEntry(patientId, name, data) {
  return await addDoc(subRef(patientId, name), { ...data, createdAt: serverTimestamp() });
}

export async function getEntries(patientId, name) {
  const snapshot = await getDocs(subRef(patientId, name));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEntry(patientId, name, entryId) {
  const snap = await getDoc(doc(db, "patients", patientId, name, entryId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateEntry(patientId, name, entryId, updates) {
  return await updateDoc(doc(db, "patients", patientId, name, entryId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEntry(patientId, name, entryId) {
  return await deleteDoc(doc(db, "patients", patientId, name, entryId));
}

// Sorted/filtered variant, useful for things like appointments or vitals
// where you want entries ordered by date instead of insertion order.
export async function getEntriesOrdered(patientId, name, field = "createdAt", direction = "desc") {
  const q = query(subRef(patientId, name), orderBy(field, direction));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Medical history ----------
export const getMedicalHistory = (id) => getEntries(id, "medicalHistory");
export const addMedicalHistoryEntry = (id, data) => addEntry(id, "medicalHistory", data);
export const updateMedicalHistoryEntry = (id, entryId, updates) => updateEntry(id, "medicalHistory", entryId, updates);
export const deleteMedicalHistoryEntry = (id, entryId) => deleteEntry(id, "medicalHistory", entryId);

// ---------- Medications ----------
export const getMedications = (id) => getEntries(id, "medications");
export const addMedication = (id, data) => addEntry(id, "medications", data);
export const updateMedication = (id, entryId, updates) => updateEntry(id, "medications", entryId, updates);
export const deleteMedication = (id, entryId) => deleteEntry(id, "medications", entryId);

// ---------- Allergies ----------
export const getAllergies = (id) => getEntries(id, "allergies");
export const addAllergy = (id, data) => addEntry(id, "allergies", data);
export const updateAllergy = (id, entryId, updates) => updateEntry(id, "allergies", entryId, updates);
export const deleteAllergy = (id, entryId) => deleteEntry(id, "allergies", entryId);

// ---------- Insurance ----------
export const getInsuranceRecords = (id) => getEntries(id, "insurance");
export const addInsuranceRecord = (id, data) => addEntry(id, "insurance", data);
export const updateInsuranceRecord = (id, entryId, updates) => updateEntry(id, "insurance", entryId, updates);
export const deleteInsuranceRecord = (id, entryId) => deleteEntry(id, "insurance", entryId);

// ---------- Appointments ----------
export const getAppointments = (id) => getEntriesOrdered(id, "appointments", "scheduledAt", "asc");
export const addAppointment = (id, data) => addEntry(id, "appointments", data);
export const updateAppointment = (id, entryId, updates) => updateEntry(id, "appointments", entryId, updates);
export const deleteAppointment = (id, entryId) => deleteEntry(id, "appointments", entryId);

// ---------- Document / file storage (scans, ID cards, insurance cards, lab reports) ----------
// Stores the file in Firebase Storage under patients/{patientId}/documents/
// and writes a matching Firestore record so it shows up alongside other data.
export async function uploadPatientDocument(patientId, file, metadata = {}) {
  const path = `patients/${patientId}/documents/${Date.now()}_${file.name}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  const docRef = await addEntry(patientId, "documents", {
    ...metadata,
    fileName: file.name,
    storagePath: path,
    url,
  });

  return { id: docRef.id, url, storagePath: path };
}

export const getPatientDocuments = (id) => getEntries(id, "documents");

// Deletes both the Firestore record AND the underlying file in Storage —
// deleting only the record would leave the actual scan/PDF orphaned.
export async function deletePatientDocument(patientId, entryId) {
  const record = await getEntry(patientId, "documents", entryId);
  if (record?.storagePath) {
    try {
      await deleteObject(storageRef(storage, record.storagePath));
    } catch (err) {
      // File may already be gone; don't block deleting the record over it.
      console.warn("Could not delete storage file:", err);
    }
  }
  return await deleteEntry(patientId, "documents", entryId);
}

// ---------- Cloud Functions (e.g. verifying insurance eligibility) ----------
export async function verifyInsuranceEligibility(patientId, insuranceId) {
  const callable = httpsCallable(functions, "verifyInsuranceEligibility");
  const result = await callable({ patientId, insuranceId });
  return result.data;
}

// ---------- Helpers ----------
export function timestampToDate(ts) {
  return ts instanceof Timestamp ? ts.toDate() : ts ? new Date(ts) : null;
}
