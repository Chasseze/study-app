// One-time cleanup of legacy on-device note storage.
//
// Earlier versions stored notes locally (localStorage + IndexedDB) and under an
// anonymous device id. The app is now cloud-only, so any leftover local copies
// are stale and can resurface the seed/"Getting Started" note or otherwise
// interfere. This removes them so the only source of truth is Firebase.
//
// UI-only preferences (theme, saved filter views) are intentionally preserved.

const LEGACY_LOCALSTORAGE_KEYS = [
  'studyApp.topics.v1', // old localStorage topics adapter
  'firebase_device_id'  // old anonymous device path key
];

const LEGACY_IDB_NAMES = ['studyAppDB'];

export default function purgeLegacyLocalData() {
  if (typeof window === 'undefined') return;

  try {
    LEGACY_LOCALSTORAGE_KEYS.forEach((key) => {
      try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    });
  } catch (e) { /* localStorage unavailable */ }

  try {
    if (window.indexedDB && typeof window.indexedDB.deleteDatabase === 'function') {
      LEGACY_IDB_NAMES.forEach((name) => {
        try { window.indexedDB.deleteDatabase(name); } catch (e) { /* ignore */ }
      });
    }
  } catch (e) { /* indexedDB unavailable */ }
}
