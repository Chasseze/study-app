import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, remove } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Expect REACT_APP_FIREBASE_CONFIG as a JSON string or REACT_APP_FIREBASE_DB_URL as fallback
const CONFIG_JSON = process.env.REACT_APP_FIREBASE_CONFIG || '';
const DB_URL = process.env.REACT_APP_FIREBASE_DB_URL || '';

function parseConfig() {
  if (CONFIG_JSON) {
    try {
      return JSON.parse(CONFIG_JSON);
    } catch (e) {
      console.warn('firebaseSdkStorage: invalid REACT_APP_FIREBASE_CONFIG JSON', e);
      return null;
    }
  }
  return null;
}

function getAppInstance() {
  if (getApps().length > 0) return getApps()[0];
  const cfg = parseConfig();
  if (!cfg && !DB_URL) return null;
  const initCfg = cfg || { databaseURL: DB_URL };
  try {
    return initializeApp(initCfg);
  } catch (e) {
    // initializeApp can throw if called multiple times with different configs
    console.warn('firebaseSdkStorage: failed to initialize app', e);
    return null;
  }
}

async function ensureAuth(app) {
  try {
    const auth = getAuth(app);
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: anonymous auth failed', e);
    return false;
  }
}

async function loadTopics() {
  const app = getAppInstance();
  if (!app) {
    console.warn('firebaseSdkStorage: no firebase config found');
    return null;
  }
  try {
    // Optional: ensure we have an auth token to satisfy DB rules
    await ensureAuth(app);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const basePath = auth.currentUser ? `users/${auth.currentUser.uid}/topics` : 'topics';
    const snapshot = await get(ref(db, basePath));
    if (!snapshot.exists()) return null;
    const val = snapshot.val();
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val);
    return null;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to load topics', e);
    return null;
  }
}

async function saveTopics(topics) {
  const app = getAppInstance();
  if (!app) {
    console.warn('firebaseSdkStorage: no firebase config found');
    return false;
  }
  try {
    await ensureAuth(app);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const basePath = auth.currentUser ? `users/${auth.currentUser.uid}/topics` : 'topics';
    await set(ref(db, basePath), topics);
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to save topics', e);
    return false;
  }
}

async function clearTopics() {
  const app = getAppInstance();
  if (!app) {
    console.warn('firebaseSdkStorage: no firebase config found');
    return false;
  }
  try {
    await ensureAuth(app);
    const db = getDatabase(app);
    const auth = getAuth(app);
    const basePath = auth.currentUser ? `users/${auth.currentUser.uid}/topics` : 'topics';
    await remove(ref(db, basePath));
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to clear topics', e);
    return false;
  }
}

const firebaseSdkAdapter = { loadTopics, saveTopics, clearTopics };

export default firebaseSdkAdapter;
