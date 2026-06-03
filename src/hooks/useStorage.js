import { useState, useCallback, useRef, useEffect } from 'react';
import adapter from '../lib/adapter';

const IS_TEST = process.env.NODE_ENV === 'test';

function toValidTopics(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((topic) => topic && typeof topic === 'object' && topic.id != null);
}

// Stable signature of a topic so we can detect real changes for diff-sync.
function signature(topic) {
  try {
    return JSON.stringify(topic);
  } catch (e) {
    return String(topic && topic.id);
  }
}

/**
 * Cloud-only storage hook.
 *
 * Durability guarantees:
 *  - Hydration and auto-save are gated on an authoritative load for the
 *    signed-in user (`canAutoSave`). We never persist before we've read what
 *    the account already has, so a transient empty/seed state can't clobber.
 *  - Persistence is DIFF-BASED and per-topic: only changed topics are written
 *    (update) and only removed topics are deleted (remove). We never rewrite
 *    the whole collection, so nothing can be wiped wholesale.
 */
export default function useStorage(onTopicsLoaded) {
  const [storageKey] = useState('firebase');
  const [storageMeta] = useState(() => adapter.getCurrentAdapterMeta());
  const [statusMessage, setStatusMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canAutoSave, setCanAutoSave] = useState(false);
  const [authUser, setAuthUser] = useState(() => adapter.getCurrentUser());

  const onTopicsLoadedRef = useRef(onTopicsLoaded);
  const realtimeUnsubscribeRef = useRef(() => {});
  const hydrateRunIdRef = useRef(0);
  // Map<string id, signature> of what we believe is currently in the cloud.
  const lastSyncedRef = useRef(new Map());

  useEffect(() => {
    onTopicsLoadedRef.current = onTopicsLoaded;
  }, [onTopicsLoaded]);

  const rememberSynced = useCallback((topics) => {
    const map = new Map();
    toValidTopics(topics).forEach((t) => map.set(String(t.id), signature(t)));
    lastSyncedRef.current = map;
  }, []);

  const resubscribeRealtime = useCallback(() => {
    if (typeof realtimeUnsubscribeRef.current === 'function') {
      realtimeUnsubscribeRef.current();
    }
    realtimeUnsubscribeRef.current = adapter.subscribeToChanges((updatedTopics) => {
      setLastSyncTime(Date.now());
      if (Array.isArray(updatedTopics)) {
        rememberSynced(updatedTopics);
        onTopicsLoadedRef.current(updatedTopics);
      }
    });
  }, [rememberSynced]);

  const hydrateForUser = useCallback(async (user) => {
    const runId = ++hydrateRunIdRef.current;
    setIsInitialized(false);
    setCanAutoSave(false);

    // Signed out: clear everything, don't load or save anything.
    if (!user && !IS_TEST) {
      if (typeof realtimeUnsubscribeRef.current === 'function') {
        realtimeUnsubscribeRef.current();
        realtimeUnsubscribeRef.current = () => {};
      }
      lastSyncedRef.current = new Map();
      onTopicsLoadedRef.current([]);
      setIsInitialized(true);
      setCanAutoSave(false);
      return;
    }

    setIsSyncing(true);
    try {
      const loaded = await adapter.loadTopics();
      if (runId !== hydrateRunIdRef.current) return;
      setLastSyncTime(Date.now());

      if (Array.isArray(loaded)) {
        rememberSynced(loaded);
        // The cloud is authoritative: apply it even when empty. A new/empty
        // account shows the empty state (no seed), and nothing gets
        // auto-persisted that the user didn't create.
        onTopicsLoadedRef.current(loaded);
      }
      resubscribeRealtime();
    } catch (error) {
      if (runId !== hydrateRunIdRef.current) return;
      console.error('Hydration error:', error);
    } finally {
      if (runId === hydrateRunIdRef.current) {
        setIsSyncing(false);
        setIsInitialized(true);
        setCanAutoSave(true);
      }
    }
  }, [rememberSynced, resubscribeRealtime]);

  // Auth is the source of truth. We wait for it to resolve, then hydrate.
  useEffect(() => {
    if (IS_TEST) {
      // In tests there is no real auth; just mark ready so feature tests run.
      setIsInitialized(true);
      setCanAutoSave(false);
      return;
    }
    const unsub = adapter.onAuthChange((user) => {
      setAuthUser(user || null);
      hydrateForUser(user || null);
    });
    return () => {
      if (typeof realtimeUnsubscribeRef.current === 'function') {
        realtimeUnsubscribeRef.current();
      }
      if (typeof unsub === 'function') unsub();
    };
  }, [hydrateForUser]);

  const storageOptions = adapter.listAdapters();
  const storageDescription = storageMeta?.description || '';
  const storageShortLabel = storageMeta?.shortLabel || storageMeta?.label || '';

  // Diff-based sync. Writes only what changed; removes only what was deleted.
  const syncTopics = useCallback(async (topics) => {
    if (!canAutoSave || IS_TEST) return;
    if (!adapter.getCurrentUser()) return;

    const valid = toValidTopics(topics);
    const prev = lastSyncedRef.current;
    const nextMap = new Map();
    const toWrite = [];

    for (const topic of valid) {
      const id = String(topic.id);
      const sig = signature(topic);
      nextMap.set(id, sig);
      if (prev.get(id) !== sig) toWrite.push(topic);
    }
    const toRemove = [];
    for (const id of prev.keys()) {
      if (!nextMap.has(id)) toRemove.push(id);
    }

    if (toWrite.length === 0 && toRemove.length === 0) return;

    setIsSyncing(true);
    try {
      await Promise.all([
        ...toWrite.map((t) => adapter.saveTopic(t)),
        ...toRemove.map((id) => adapter.removeTopic(id))
      ]);
      lastSyncedRef.current = nextMap;
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Sync error:', error);
      setStatusMessage('Some changes failed to sync. They will retry on your next edit.');
    } finally {
      setIsSyncing(false);
    }
  }, [canAutoSave]);

  // Immediate, reliable deletion (not debounced) so a delete can't be lost if
  // the user navigates away quickly, and a deleted note can't resurrect on the
  // next load.
  const removeTopicNow = useCallback(async (id) => {
    if (IS_TEST || id == null) return;
    if (!adapter.getCurrentUser()) return;
    try {
      await adapter.removeTopic(id);
      lastSyncedRef.current.delete(String(id));
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Delete sync error:', error);
    }
  }, []);

  const loadTopics = useCallback(async () => {
    setIsSyncing(true);
    try {
      const loaded = await adapter.loadTopics();
      setLastSyncTime(Date.now());
      return loaded;
    } catch (error) {
      console.error('Load error:', error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    storageKey,
    storageMeta,
    storageOptions,
    storageDescription,
    storageShortLabel,
    isSwitchingStorage: false,
    isSyncing,
    isInitialized,
    canAutoSave,
    lastSyncTime,
    statusMessage,
    authUser,
    // saveTopics is now the diff-based syncer (kept name for App.js call site).
    saveTopics: syncTopics,
    removeTopicNow,
    loadTopics
  };
}
