const KEY = 'studyApp.topics.v1';

export function loadTopics() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (e) {
    // corrupt data: remove key and fallback
    try { window.localStorage.removeItem(KEY); } catch (_) {}
    console.warn('Failed to load topics from localStorage, cleared key.', e);
    return null;
  }
}

export function saveTopics(topics) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(topics));
    return true;
  } catch (e) {
    console.warn('Failed to save topics to localStorage', e);
    return false;
  }
}

export function clearTopics() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (e) {
    console.warn('Failed to clear topics key', e);
  }
}

const localStorageAdapter = { loadTopics, saveTopics, clearTopics };

export default localStorageAdapter;
