import { useState, useCallback, useRef, useEffect } from 'react';
import adapter, { getCurrentAdapterMeta, getCurrentAdapterKey, listAdapters } from '../lib/adapter';

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
  const initialLoadDone = useRef(false);
  const onTopicsLoadedRef = useRef(onTopicsLoaded);
  
  // Keep callback ref up to date
  useEffect(() => {
    onTopicsLoadedRef.current = onTopicsLoaded;
  }, [onTopicsLoaded]);

  // Load topics on mount and subscribe to real-time updates
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    let unsubscribe = () => {};

    const loadInitial = async () => {
      setIsSyncing(true);
      try {
        const loaded = await adapter.loadTopics();
        setLastSyncTime(Date.now());
        if (Array.isArray(loaded) && loaded.length > 0) {
          onTopicsLoadedRef.current(loaded);
        }
        
        // Subscribe to real-time updates for cross-device sync
        unsubscribe = adapter.subscribeToChanges((updatedTopics) => {
          setLastSyncTime(Date.now());
          if (Array.isArray(updatedTopics) && updatedTopics.length > 0) {
            onTopicsLoadedRef.current(updatedTopics);
          }
        });
      } catch (error) {
        console.error('Initial load error:', error);
      } finally {
        setIsSyncing(false);
        // Mark as initialized AFTER load attempt completes
        setIsInitialized(true);
      }
    };
    loadInitial();
    
    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const storageOptions = listAdapters();
  const storageDescription = storageMeta?.description || '';
  const storageShortLabel = storageMeta?.shortLabel || storageMeta?.label || '';

  const switchStorage = useCallback(async (nextKey) => {
    if (!nextKey || nextKey === storageKey) {
      return;
    }

    setIsSwitchingStorage(true);
    setIsSyncing(true);
    try {
      adapter.setAdapter(nextKey);
      setStorageKey(nextKey);
      const nextMeta = getCurrentAdapterMeta(nextKey);
      setStorageMeta(nextMeta);
      setStatusMessage(`Switched to ${nextMeta.label}`);

      const loaded = await adapter.loadTopics();
      setLastSyncTime(Date.now());
      if (Array.isArray(loaded) && loaded.length > 0) {
        onTopicsLoaded(loaded);
      }
    } catch (error) {
      setStatusMessage('Failed to load topics after switching storage');
      console.error('Storage switch error:', error);
    } finally {
      setIsSwitchingStorage(false);
      setIsSyncing(false);
    }
  }, [storageKey, onTopicsLoaded]);

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

  return {
    storageKey,
    storageMeta,
    storageOptions,
    storageDescription,
    storageShortLabel,
    isSwitchingStorage,
    isSyncing,
    isInitialized,
    lastSyncTime,
    statusMessage,
    switchStorage,
    saveTopics,
    loadTopics
  };
}
