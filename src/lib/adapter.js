import firebase from './firebaseSdkStorage';

// Cloud-only. Local/offline adapters were removed: anonymous/offline storage
// was the source of orphaned, lost notes. Everything now syncs to Firebase
// under the signed-in user.

const adapterMeta = {
  firebase: {
    key: 'firebase',
    label: 'Cloud sync',
    shortLabel: 'Cloud',
    description: 'Your notes sync securely to the cloud under your account.'
  }
};

export function listAdapters() {
  return Object.values(adapterMeta);
}

export function setAdapter() {
  // Single cloud adapter — nothing to switch.
}

export function getCurrentAdapterKey() {
  return 'firebase';
}

export function getCurrentAdapterMeta() {
  return adapterMeta.firebase;
}

export async function loadTopics() { return firebase.loadTopics(); }
export async function saveTopic(topic) { return firebase.saveTopic(topic); }
export async function removeTopic(id) { return firebase.removeTopic(id); }
export async function saveTopics(topics) { return firebase.saveTopics(topics); }
export async function clearTopics() { return firebase.clearTopics(); }
export function subscribeToChanges(callback) { return firebase.subscribeToChanges(callback); }
export function onAuthChange(callback) { return firebase.onAuthChange(callback); }
export function getCurrentUser() { return firebase.getCurrentUser(); }
export function getSyncStatus() { return firebase.getSyncStatus(); }
export function isConfigured() { return firebase.isConfigured(); }

const adapterExport = {
  setAdapter,
  loadTopics,
  saveTopic,
  removeTopic,
  saveTopics,
  clearTopics,
  subscribeToChanges,
  onAuthChange,
  getCurrentUser,
  getSyncStatus,
  isConfigured,
  getCurrentAdapterKey,
  getCurrentAdapterMeta,
  listAdapters
};

export default adapterExport;
