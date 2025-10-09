import local from './storage';
import api from './apiStorage';
import idb from './idbStorage';

const DEFAULT = process.env.REACT_APP_STORAGE || 'local';

function getAdapter(name) {
  switch ((name || DEFAULT).toLowerCase()) {
    case 'api': return api;
    case 'idb': return idb;
    case 'local':
    default:
      return local;
  }
}

let current = getAdapter();

export function setAdapter(name) {
  current = getAdapter(name);
}

export async function loadTopics() { return current.loadTopics ? await current.loadTopics() : null; }
export async function saveTopics(topics) { return current.saveTopics ? await current.saveTopics(topics) : false; }
export async function clearTopics() { return current.clearTopics ? await current.clearTopics() : false; }

const adapterExport = { setAdapter, loadTopics, saveTopics, clearTopics };

export default adapterExport;
