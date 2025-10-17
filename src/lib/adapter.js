import local from './storage';
import api from './apiStorage';
import idb from './idbStorage';

const DEFAULT_SOURCE = (process.env.REACT_APP_STORAGE || 'local').toLowerCase();

const adapterMeta = {
  local: {
    key: 'local',
    label: 'Browser storage',
    shortLabel: 'LL',
    description: 'Notes are saved to this browser using localStorage.'
  },
  idb: {
    key: 'idb',
    label: 'Offline storage',
    shortLabel: 'IDB',
    description: 'Notes are stored locally using IndexedDB for larger datasets.'
  },
  api: {
    key: 'api',
    label: 'Remote API',
    shortLabel: 'API',
    description: 'Notes sync with the configured API service.'
  }
};

function normalizeKey(name) {
  return (name || DEFAULT_SOURCE).toLowerCase();
}

function getAdapter(name) {
  switch (normalizeKey(name)) {
    case 'api': return api;
    case 'idb': return idb;
    case 'local':
    default:
      return local;
  }
}

function getAdapterMeta(name) {
  const key = normalizeKey(name);
  return adapterMeta[key] || adapterMeta.local;
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

const adapterExport = {
  setAdapter,
  loadTopics,
  saveTopics,
  clearTopics,
  getCurrentAdapterKey,
  getCurrentAdapterMeta,
  listAdapters
};

export default adapterExport;
