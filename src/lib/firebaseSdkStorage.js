import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, remove, onValue, off } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

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

let appInstance = null;

function getAppInstance() {
  if (appInstance) return appInstance;
  if (getApps().length > 0) {
    appInstance = getApps()[0];
    return appInstance;
  }
  const cfg = parseConfig();
  if (!cfg && !DB_URL) {
    console.warn('firebaseSdkStorage: no firebase config found. Set REACT_APP_FIREBASE_CONFIG or REACT_APP_FIREBASE_DB_URL');
    return null;
  }
  const initCfg = cfg || { databaseURL: DB_URL };
  try {
    appInstance = initializeApp(initCfg);
    return appInstance;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to initialize app', e);
    return null;
  }
}

// Get current user synchronously (if available)
function getCurrentUser() {
  const app = getAppInstance();
  if (!app) return null;
  try {
    const auth = getAuth(app);
    return auth.currentUser;
  } catch (e) {
    return null;
  }
}

// Get the database path for topics (user-specific if authenticated)
function getTopicsPath() {
  const user = getCurrentUser();
  if (user) {
    return `users/${user.uid}/topics`;
  }
  // For unauthenticated users, use a device-specific ID stored in localStorage
  let deviceId = localStorage.getItem('firebase_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('firebase_device_id', deviceId);
  }
  return `devices/${deviceId}/topics`;
}

// Store listeners for real-time updates
let activeListener = null;
let activeListenerPath = null;
let lastSyncTime = null;

async function loadTopics() {
  const app = getAppInstance();
  if (!app) {
    return null;
  }
  try {
    const db = getDatabase(app);
    const basePath = getTopicsPath();
    const snapshot = await get(ref(db, basePath));
    lastSyncTime = Date.now();
    
    if (!snapshot.exists()) {
      return null;
    }
    const val = snapshot.val();
    let topics = [];
    if (Array.isArray(val)) {
      topics = val;
    } else if (val && typeof val === 'object') {
      topics = Object.values(val);
    }
    // Filter out null/undefined values that can exist in Firebase arrays
    return topics.filter(t => t != null && typeof t === 'object' && t.id != null);
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to load topics', e);
    return null;
  }
}

async function saveTopics(topics) {
  const app = getAppInstance();
  if (!app) {
    return false;
  }
  
  if (!topics || !Array.isArray(topics)) {
    return false;
  }
  
  try {
    const db = getDatabase(app);
    const basePath = getTopicsPath();
    
    // Convert array to object with topic IDs as keys for better Firebase structure
    // Prefix numeric IDs with 'topic_' to ensure valid Firebase keys
    const topicsObject = {};
    topics.forEach((topic, index) => {
      const rawKey = topic.id != null ? String(topic.id) : `idx_${index}`;
      // Firebase keys can't start with numbers in some cases, so prefix them
      const key = /^\d/.test(rawKey) ? `topic_${rawKey}` : rawKey;
      topicsObject[key] = { ...topic, id: topic.id }; // Preserve original id in the data
    });
    
    await set(ref(db, basePath), topicsObject);
    lastSyncTime = Date.now();
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
    const db = getDatabase(app);
    const basePath = getTopicsPath();
    await remove(ref(db, basePath));
    lastSyncTime = Date.now();
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to clear topics', e);
    return false;
  }
}

// Subscribe to real-time updates from Firebase
function subscribeToChanges(callback) {
  const app = getAppInstance();
  if (!app) return () => {};
  
  try {
    const db = getDatabase(app);
    const basePath = getTopicsPath();
    const topicsRef = ref(db, basePath);
    
    // Unsubscribe from previous listener if path changed
    if (activeListener && activeListenerPath !== basePath) {
      off(ref(db, activeListenerPath));
      activeListener = null;
    }
    
    activeListenerPath = basePath;
    activeListener = onValue(topicsRef, (snapshot) => {
      lastSyncTime = Date.now();
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const val = snapshot.val();
      let topics = [];
      if (Array.isArray(val)) {
        topics = val;
      } else if (val && typeof val === 'object') {
        topics = Object.values(val);
      }
      // Filter out null/undefined values that can exist in Firebase arrays
      const validTopics = topics.filter(t => t != null && typeof t === 'object' && t.id != null);
      callback(validTopics);
    }, (error) => {
      console.warn('firebaseSdkStorage: realtime listener error', error);
    });
    
    return () => {
      off(topicsRef);
      activeListener = null;
      activeListenerPath = null;
    };
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to subscribe', e);
    return () => {};
  }
}

// Listen for auth state changes to reload data when user signs in/out
function onAuthChange(callback) {
  const app = getAppInstance();
  if (!app) return () => {};
  
  try {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, callback);
  } catch (e) {
    return () => {};
  }
}

// Get sync status
function getSyncStatus() {
  const user = getCurrentUser();
  return {
    isAuthenticated: !!user,
    userEmail: user?.email || null,
    userId: user?.uid || null,
    lastSyncTime,
    syncEnabled: !!(CONFIG_JSON || DB_URL)
  };
}

// Check if Firebase is configured
function isConfigured() {
  return !!(CONFIG_JSON || DB_URL);
}

const firebaseSdkAdapter = { 
  loadTopics, 
  saveTopics, 
  clearTopics,
  subscribeToChanges,
  onAuthChange,
  getSyncStatus,
  getCurrentUser,
  isConfigured
};

export default firebaseSdkAdapter;
