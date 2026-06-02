import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const CONFIG_JSON = process.env.REACT_APP_FIREBASE_CONFIG || '';
const DB_URL = process.env.REACT_APP_FIREBASE_DB_URL || '';

function parseConfig() {
  if (CONFIG_JSON) {
    try {
      return JSON.parse(CONFIG_JSON);
    } catch (e) {
      console.warn('firebaseClient: invalid REACT_APP_FIREBASE_CONFIG JSON', e);
      return null;
    }
  }
  return null;
}

export function getAppInstance() {
  if (getApps().length > 0) return getApps()[0];
  const cfg = parseConfig();
  if (!cfg && !DB_URL) return null;
  const initCfg = cfg || { databaseURL: DB_URL };
  try {
    return initializeApp(initCfg);
  } catch (e) {
    console.warn('firebaseClient: failed to initialize app', e);
    return null;
  }
}

export function isConfigured() {
  return !!(CONFIG_JSON || DB_URL);
}

export function getAuthInstance() {
  const app = getAppInstance();
  if (!app) return null;
  return getAuth(app);
}

export function getDatabaseInstance() {
  const app = getAppInstance();
  if (!app) return null;
  return getDatabase(app);
}

export async function signInWithGoogle() {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  // Always show the Google account chooser instead of silently using the
  // account the browser is already signed into.
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  const auth = getAuthInstance();
  if (!auth) return;
  return fbSignOut(auth);
}

export function onAuthChange(cb) {
  const auth = getAuthInstance();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, cb);
}

export async function createUserWithEmail(email, password) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase not configured');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(email, password) {
  const auth = getAuthInstance();
  if (!auth) throw new Error('Firebase not configured');
  return signInWithEmailAndPassword(auth, email, password);
}
