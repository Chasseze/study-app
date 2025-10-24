// Minimal Firebase-compatible storage adapter (env-driven, no SDK required)
// This adapter uses the Firebase Realtime Database REST API when
// REACT_APP_FIREBASE_DB_URL is set (example: https://<project>.firebaseio.com).
// It intentionally does not bundle the Firebase SDK so there are no
// new runtime dependency requirements in the app unless you opt to.

const DB_URL = process.env.REACT_APP_FIREBASE_DB_URL || '';

function warnMissingConfig() {
  console.warn('Firebase adapter: REACT_APP_FIREBASE_DB_URL is not set. Firebase adapter disabled.');
}

async function loadTopics() {
  if (!DB_URL) {
    warnMissingConfig();
    return null;
  }

  try {
    const res = await fetch(`${DB_URL.replace(/\/$/, '')}/topics.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Firebase RTDB returns an object map or an array depending on how data was written.
    if (Array.isArray(data)) return data;
    if (data === null) return null;
    // Convert map to array if needed
    if (typeof data === 'object') {
      return Object.values(data);
    }
    return null;
  } catch (e) {
    console.warn('Firebase adapter: failed to load topics', e);
    return null;
  }
}

async function saveTopics(topics) {
  if (!DB_URL) {
    warnMissingConfig();
    return false;
  }

  try {
    const res = await fetch(`${DB_URL.replace(/\/$/, '')}/topics.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topics)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (e) {
    console.warn('Firebase adapter: failed to save topics', e);
    return false;
  }
}

async function clearTopics() {
  if (!DB_URL) {
    warnMissingConfig();
    return false;
  }

  try {
    const res = await fetch(`${DB_URL.replace(/\/$/, '')}/topics.json`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (e) {
    console.warn('Firebase adapter: failed to clear topics', e);
    return false;
  }
}

const firebaseAdapter = { loadTopics, saveTopics, clearTopics };

export default firebaseAdapter;
