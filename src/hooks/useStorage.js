import { useState, useCallback, useRef, useEffect } from 'react';
import adapter, { getCurrentAdapterMeta, getCurrentAdapterKey, listAdapters } from '../lib/adapter';

function toValidTopics(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((topic) => topic && typeof topic === 'object' && topic.id != null);
}

function mergeTopics(existingTopics, incomingTopics) {
  const existing = toValidTopics(existingTopics);
  const incoming = toValidTopics(incomingTopics);

  const byId = new Map(existing.map((topic) => [String(topic.id), topic]));
  let importedCount = 0;

  for (const topic of incoming) {
    const key = String(topic.id);
    const current = byId.get(key);

    if (!current) {
      byId.set(key, topic);
      importedCount += 1;
      continue;
    }

    const currentTime = Date.parse(current.lastModified || '') || 0;
    const incomingTime = Date.parse(topic.lastModified || '') || 0;
    if (incomingTime > currentTime) {
      byId.set(key, { ...current, ...topic });
      importedCount += 1;
    }
  }

  return {
    merged: Array.from(byId.values()),
    importedCount
  };
}

/**
 * Custom hook for managing storage adapter switching and persistence
 */
export default function useStorage(onTopicsLoaded) {
  const [storageKey, setStorageKey] = useState(() => getCurrentAdapterKey());
  const [storageMeta, setStorageMeta] = useState(() => getCurrentAdapterMeta());
  const [isSwitchingStorage, setIsSwitchingStorage] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canAutoSave, setCanAutoSave] = useState(false);
  const initialLoadDone = useRef(false);
  const onTopicsLoadedRef = useRef(onTopicsLoaded);
  const realtimeUnsubscribeRef = useRef(() => {});
  const hydrateRunIdRef = useRef(0);
  
  // Keep callback ref up to date
  useEffect(() => {
    onTopicsLoadedRef.current = onTopicsLoaded;
  }, [onTopicsLoaded]);

  const resubscribeRealtime = useCallback(() => {
    if (typeof realtimeUnsubscribeRef.current === 'function') {
      realtimeUnsubscribeRef.current();
    }

    realtimeUnsubscribeRef.current = adapter.subscribeToChanges((updatedTopics) => {
      setLastSyncTime(Date.now());
      if (Array.isArray(updatedTopics)) {
        onTopicsLoadedRef.current(updatedTopics);
      }
    });
  }, []);

  const hydrateFromStorage = useCallback(async () => {
    const runId = ++hydrateRunIdRef.current;
    setIsInitialized(false);
    setCanAutoSave(false);
    setIsSyncing(true);

    try {
      const loaded = await adapter.loadTopics();
      if (runId !== hydrateRunIdRef.current) return;

      setLastSyncTime(Date.now());
      if (Array.isArray(loaded)) {
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
  }, [resubscribeRealtime]);

  // Load topics on mount and subscribe to real-time updates
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    let unsubscribeAuth = () => {};

    hydrateFromStorage();

    // Re-hydrate when auth changes because Firebase path changes (users/<uid> vs devices/<id>)
    unsubscribeAuth = adapter.onAuthChange(() => {
      hydrateFromStorage();
    });
    
    return () => {
      if (typeof realtimeUnsubscribeRef.current === 'function') {
        realtimeUnsubscribeRef.current();
      }
      unsubscribeAuth();
    };
  }, [hydrateFromStorage]);

  const storageOptions = listAdapters();
  const storageDescription = storageMeta?.description || '';
  const storageShortLabel = storageMeta?.shortLabel || storageMeta?.label || '';

  const switchStorage = useCallback(async (nextKey) => {
    if (!nextKey || nextKey === storageKey) {
      return;
    }

    setIsSwitchingStorage(true);
    setCanAutoSave(false);
    setIsInitialized(false);
    setIsSyncing(true);
    try {
      adapter.setAdapter(nextKey);
      setStorageKey(nextKey);
      const nextMeta = getCurrentAdapterMeta(nextKey);
      setStorageMeta(nextMeta);
      setStatusMessage(`Switched to ${nextMeta.label}`);

      const loaded = await adapter.loadTopics();
      setLastSyncTime(Date.now());
      if (Array.isArray(loaded)) {
        onTopicsLoadedRef.current(loaded);
      }

      resubscribeRealtime();
    } catch (error) {
      setStatusMessage('Failed to load topics after switching storage');
      console.error('Storage switch error:', error);
    } finally {
      setIsSwitchingStorage(false);
      setIsSyncing(false);
      setIsInitialized(true);
      setCanAutoSave(true);
    }
  }, [storageKey, resubscribeRealtime]);

  const saveTopics = useCallback(async (topics) => {
    setIsSyncing(true);
    try {
      await adapter.saveTopics(topics);
      setLastSyncTime(Date.now());
    } catch (error) {
      setStatusMessage('Failed to save topics');
      console.error('Save error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const loadTopics = useCallback(async () => {
    setIsSyncing(true);
    try {
      const loaded = await adapter.loadTopics();
      setLastSyncTime(Date.now());
      return loaded;
    } catch (error) {
      setStatusMessage('Failed to load topics');
      console.error('Load error:', error);
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const migrateTopicsToCurrentStorage = useCallback(async (topicsToMigrate) => {
    const incoming = toValidTopics(topicsToMigrate);
    if (incoming.length === 0) {
      return { ok: false, importedCount: 0, message: 'No topics to migrate' };
    }

    setIsSyncing(true);
    try {
      const existing = await adapter.loadTopics();
      const { merged, importedCount } = mergeTopics(existing, incoming);

      if (importedCount === 0) {
        return { ok: true, importedCount: 0, message: 'No new topics to import' };
      }

      const saved = await adapter.saveTopics(merged);
      if (!saved) {
        return { ok: false, importedCount: 0, message: 'Failed to save migrated topics' };
      }

      setLastSyncTime(Date.now());
      onTopicsLoadedRef.current(merged);
      setStatusMessage(`Imported ${importedCount} topic${importedCount === 1 ? '' : 's'} to this account`);
      return { ok: true, importedCount, message: 'Migration complete' };
    } catch (error) {
      console.error('Migration error:', error);
      return { ok: false, importedCount: 0, message: 'Migration failed' };
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
    isSwitchingStorage,
    isSyncing,
    isInitialized,
    canAutoSave,
    lastSyncTime,
    statusMessage,
    switchStorage,
    saveTopics,
    loadTopics,
    migrateTopicsToCurrentStorage
  };
}
