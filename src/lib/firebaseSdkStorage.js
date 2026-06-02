import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, child, update, get, remove, onValue, off } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// ---------------------------------------------------------------------------
// Cloud-only storage (Firebase Realtime Database).
//
// Hard rules that prevent the data-loss class of bugs we hit before:
//   1. Data ONLY lives at users/<uid>/topics. There is NO anonymous "device"
//      path — anonymous device IDs were ephemeral and orphaned people's notes.
//   2. We NEVER call set() on the whole topics collection. Writes are per-topic
//      via update()/remove(), so a transient empty/seed state can never wipe
//      the entire collection.
//   3. Reads/writes require an authenticated user. If nobody is signed in,
//      loads return null and writes are no-ops — so we never persist into the
//      wrong place.
// ---------------------------------------------------------------------------

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
    console.warn('firebaseSdkStorage: no firebase config found.');
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

function getCurrentUser() {
  const app = getAppInstance();
  if (!app) return null;
  try {
    return getAuth(app).currentUser;
  } catch (e) {
    return null;
  }
}

// Topics live under the signed-in user only. Returns null when not authed.
function getTopicsPath() {
  const user = getCurrentUser();
  if (!user) return null;
  return `users/${user.uid}/topics`;
}

// Firebase keys can't be bare numbers in a clean way; prefix numeric ids.
function keyForId(id) {
  const raw = id != null ? String(id) : '';
  if (!raw) return null;
  return /^\d/.test(raw) ? `topic_${raw}` : raw;
}

let lastSyncTime = null;
let activeRef = null;

function normalizeSnapshotValue(val) {
  let topics = [];
  if (Array.isArray(val)) {
    topics = val;
  } else if (val && typeof val === 'object') {
    topics = Object.values(val);
  }
  return topics.filter(t => t != null && typeof t === 'object' && t.id != null);
}

async function loadTopics() {
  const app = getAppInstance();
  if (!app) return null;
  const basePath = getTopicsPath();
  if (!basePath) return null; // not signed in — nothing to load
  try {
    const db = getDatabase(app);
    const snapshot = await get(ref(db, basePath));
    lastSyncTime = Date.now();
    if (!snapshot.exists()) return []; // signed in, no topics yet
    return normalizeSnapshotValue(snapshot.val());
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to load topics', e);
    return null;
  }
}

// Write a single topic (merge). Never touches sibling topics.
async function saveTopic(topic) {
  const app = getAppInstance();
  if (!app || !topic || topic.id == null) return false;
  const basePath = getTopicsPath();
  if (!basePath) return false;
  const key = keyForId(topic.id);
  if (!key) return false;
  try {
    const db = getDatabase(app);
    await update(child(ref(db), `${basePath}/${key}`), { ...topic, id: topic.id });
    lastSyncTime = Date.now();
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to save topic', e);
    return false;
  }
}

// Remove a single topic.
async function removeTopic(id) {
  const app = getAppInstance();
  if (!app || id == null) return false;
  const basePath = getTopicsPath();
  if (!basePath) return false;
  const key = keyForId(id);
  if (!key) return false;
  try {
    const db = getDatabase(app);
    await remove(ref(db, `${basePath}/${key}`));
    lastSyncTime = Date.now();
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to remove topic', e);
    return false;
  }
}

// Bulk write used for imports/migrations. Implemented as a multi-location
// update() so it MERGES (adds/updates listed topics) and can never delete
// topics that aren't in the list. Deletions must go through removeTopic.
async function saveTopics(topics) {
  const app = getAppInstance();
  if (!app || !Array.isArray(topics)) return false;
  const basePath = getTopicsPath();
  if (!basePath) return false;
  try {
    const db = getDatabase(app);
    const payload = {};
    topics.forEach((topic) => {
      if (!topic || topic.id == null) return;
      const key = keyForId(topic.id);
      if (key) payload[`${basePath}/${key}`] = { ...topic, id: topic.id };
    });
    if (Object.keys(payload).length === 0) return true;
    await update(ref(db), payload);
    lastSyncTime = Date.now();
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to save topics', e);
    return false;
  }
}

async function clearTopics() {
  const app = getAppInstance();
  if (!app) return false;
  const basePath = getTopicsPath();
  if (!basePath) return false;
  try {
    const db = getDatabase(app);
    await remove(ref(db, basePath));
    lastSyncTime = Date.now();
    return true;
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to clear topics', e);
    return false;
  }
}

function subscribeToChanges(callback) {
  const app = getAppInstance();
  if (!app) return () => {};
  const basePath = getTopicsPath();
  if (!basePath) return () => {}; // only subscribe when authed
  try {
    const db = getDatabase(app);
    const topicsRef = ref(db, basePath);

    if (activeRef) {
      off(activeRef);
      activeRef = null;
    }
    activeRef = topicsRef;

    onValue(topicsRef, (snapshot) => {
      lastSyncTime = Date.now();
      callback(snapshot.exists() ? normalizeSnapshotValue(snapshot.val()) : []);
    }, (error) => {
      console.warn('firebaseSdkStorage: realtime listener error', error);
    });

    return () => {
      off(topicsRef);
      if (activeRef === topicsRef) activeRef = null;
    };
  } catch (e) {
    console.warn('firebaseSdkStorage: failed to subscribe', e);
    return () => {};
  }
}

function onAuthChange(callback) {
  const app = getAppInstance();
  if (!app) return () => {};
  try {
    return onAuthStateChanged(getAuth(app), callback);
  } catch (e) {
    return () => {};
  }
}

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

function isConfigured() {
  return !!(CONFIG_JSON || DB_URL);
}

const firebaseSdkAdapter = {
  loadTopics,
  saveTopic,
  removeTopic,
  saveTopics,
  clearTopics,
  subscribeToChanges,
  onAuthChange,
  getSyncStatus,
  getCurrentUser,
  isConfigured
};

export default firebaseSdkAdapter;
