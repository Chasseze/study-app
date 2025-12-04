import idb from './idbStorage';
import firebase from './firebaseSdkStorage';

const DEFAULT_SOURCE = (process.env.REACT_APP_STORAGE || 'firebase').toLowerCase();

const adapterMeta = {
  idb: {
    key: 'idb',
    label: 'Offline storage',
    shortLabel: 'IDB',
    description: 'Notes are stored locally using IndexedDB. Works offline but does not sync across devices.'
  },
  firebase: {
    key: 'firebase',
    label: 'Cloud sync',
    shortLabel: 'FB',
    description: 'Sync notes to Firebase cloud. Sign in to access your notes from any device.'
  }
};

function normalizeKey(name) {
  const key = (name || DEFAULT_SOURCE).toLowerCase();
  // Only allow firebase or idb
  if (key === 'firebase' || key === 'idb') {
    return key;
  }
  return 'firebase'; // Default to firebase
}

function getAdapter(name) {
  switch (normalizeKey(name)) {
    case 'idb': return idb;
    case 'firebase':
    default:
      return firebase;
  }
}

function getAdapterMeta(name) {
  const key = normalizeKey(name);
  return adapterMeta[key] || adapterMeta.firebase;
}

export function listAdapters() {
  return Object.values(adapterMeta);
}

let currentKey = normalizeKey();
let current = getAdapter(currentKey);

export function setAdapter(name) {
  currentKey = normalizeKey(name);
  current = getAdapter(currentKey);
}

export function getCurrentAdapterKey() {
  return currentKey;
}

export function getCurrentAdapterMeta() {
  return getAdapterMeta(currentKey);
}

export async function loadTopics() { return current.loadTopics ? await current.loadTopics() : null; }
export async function saveTopics(topics) { return current.saveTopics ? await current.saveTopics(topics) : false; }
export async function clearTopics() { return current.clearTopics ? await current.clearTopics() : false; }
export function subscribeToChanges(callback) { 
  return current.subscribeToChanges ? current.subscribeToChanges(callback) : () => {}; 
}

const adapterExport = {
  setAdapter,
  loadTopics,
  saveTopics,
  clearTopics,
  subscribeToChanges,
  getCurrentAdapterKey,
  getCurrentAdapterMeta,
  listAdapters
};

export default adapterExport;
