/**
 * Lazy Firebase Client
 * Dynamically imports Firebase SDK only when needed to reduce initial bundle size
 */

const CONFIG_JSON = process.env.REACT_APP_FIREBASE_CONFIG || '';
const DB_URL = process.env.REACT_APP_FIREBASE_DB_URL || '';

// Cache for lazy-loaded modules
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let authModule = null;
let dbModule = null;

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

export function isConfigured() {
  return !!(CONFIG_JSON || DB_URL);
}

/**
 * Lazily load and initialize Firebase app
 */
async function getAppInstanceAsync() {
  if (firebaseApp) return firebaseApp;
  
  const { initializeApp, getApps } = await import('firebase/app');
  
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }
  
  const cfg = parseConfig();
  if (!cfg && !DB_URL) return null;
  
  const initCfg = cfg || { databaseURL: DB_URL };
  try {
    firebaseApp = initializeApp(initCfg);
    return firebaseApp;
  } catch (e) {
    console.warn('firebaseClient: failed to initialize app', e);
    return null;
  }
}

/**
 * Lazily load Firebase Auth
 */
async function getAuthInstanceAsync() {
  if (firebaseAuth) return firebaseAuth;
  
  const app = await getAppInstanceAsync();
  if (!app) return null;
  
  if (!authModule) {
    authModule = await import('firebase/auth');
  }
  
  firebaseAuth = authModule.getAuth(app);
  return firebaseAuth;
}

/**
 * Lazily load Firebase Database
 */
async function getDatabaseInstanceAsync() {
  if (firebaseDb) return firebaseDb;
  
  const app = await getAppInstanceAsync();
  if (!app) return null;
  
  if (!dbModule) {
    dbModule = await import('firebase/database');
  }
  
  firebaseDb = dbModule.getDatabase(app);
  return firebaseDb;
}

/**
 * Sign in with Google (lazy loads auth module)
 */
export async function signInWithGoogle() {
  const auth = await getAuthInstanceAsync();
  if (!auth) throw new Error('Firebase not configured');
  
  const { GoogleAuthProvider, signInWithPopup } = authModule;
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Sign out (lazy loads auth module)
 */
export async function signOut() {
  const auth = await getAuthInstanceAsync();
  if (!auth) return;
  
  return authModule.signOut(auth);
}

/**
 * Create user with email and password
 */
export async function createUserWithEmail(email, password) {
  const auth = await getAuthInstanceAsync();
  if (!auth) throw new Error('Firebase not configured');
  
  return authModule.createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
  const auth = await getAuthInstanceAsync();
  if (!auth) throw new Error('Firebase not configured');
  
  return authModule.signInWithEmailAndPassword(auth, email, password);
}

/**
 * Listen for auth state changes
 * This is called synchronously so we need to handle the async loading
 */
export function onAuthChange(callback) {
  if (!isConfigured()) {
    callback(null);
    return () => {};
  }
  
  let unsubscribe = () => {};
  
  // Load auth async and set up listener
  getAuthInstanceAsync().then(auth => {
    if (auth && authModule) {
      unsubscribe = authModule.onAuthStateChanged(auth, callback);
    } else {
      callback(null);
    }
  }).catch(() => {
    callback(null);
  });
  
  return () => unsubscribe();
}

/**
 * Get database reference for topics
 */
export async function getTopicsRef(userId) {
  const db = await getDatabaseInstanceAsync();
  if (!db || !dbModule) return null;
  
  return dbModule.ref(db, `users/${userId}/topics`);
}

/**
 * Save topics to Firebase
 */
export async function saveTopicsToFirebase(userId, topics) {
  const topicsRef = await getTopicsRef(userId);
  if (!topicsRef) return false;
  
  try {
    await dbModule.set(topicsRef, topics);
    return true;
  } catch (e) {
    console.error('Failed to save topics to Firebase:', e);
    return false;
  }
}

/**
 * Load topics from Firebase
 */
export async function loadTopicsFromFirebase(userId) {
  const topicsRef = await getTopicsRef(userId);
  if (!topicsRef) return null;
  
  try {
    const snapshot = await dbModule.get(topicsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return [];
  } catch (e) {
    console.error('Failed to load topics from Firebase:', e);
    return null;
  }
}

/**
 * Listen for realtime topic updates
 */
export async function onTopicsChange(userId, callback) {
  const topicsRef = await getTopicsRef(userId);
  if (!topicsRef) {
    callback([]);
    return () => {};
  }
  
  return dbModule.onValue(topicsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  });
}

// Synchronous versions for backward compatibility (used in existing code)
// These use the cached instances if available
export function getAppInstance() {
  return firebaseApp;
}

export function getAuthInstance() {
  return firebaseAuth;
}

export function getDatabaseInstance() {
  return firebaseDb;
}
