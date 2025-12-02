import { useState, useCallback } from 'react';
import adapter, { getCurrentAdapterMeta, getCurrentAdapterKey, listAdapters } from '../lib/adapter';

/**
 * Custom hook for managing storage adapter switching and persistence
 */
export default function useStorage(onTopicsLoaded) {
  const [storageKey, setStorageKey] = useState(() => getCurrentAdapterKey());
  const [storageMeta, setStorageMeta] = useState(() => getCurrentAdapterMeta());
  const [isSwitchingStorage, setIsSwitchingStorage] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const storageOptions = listAdapters();
  const storageDescription = storageMeta?.description || '';
  const storageShortLabel = storageMeta?.shortLabel || storageMeta?.label || '';

  const switchStorage = useCallback(async (nextKey) => {
    if (!nextKey || nextKey === storageKey) {
      return;
    }

    setIsSwitchingStorage(true);
    try {
      adapter.setAdapter(nextKey);
      setStorageKey(nextKey);
      const nextMeta = getCurrentAdapterMeta(nextKey);
      setStorageMeta(nextMeta);
      setStatusMessage(`Switched to ${nextMeta.label}`);

      const loaded = await adapter.loadTopics();
      if (Array.isArray(loaded) && loaded.length > 0) {
        onTopicsLoaded(loaded);
      }
    } catch (error) {
      setStatusMessage('Failed to load topics after switching storage');
      console.error('Storage switch error:', error);
    } finally {
      setIsSwitchingStorage(false);
    }
  }, [storageKey, onTopicsLoaded]);

  const saveTopics = useCallback(async (topics) => {
    try {
      await adapter.saveTopics(topics);
    } catch (error) {
      setStatusMessage('Failed to save topics');
      console.error('Save error:', error);
    }
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const loaded = await adapter.loadTopics();
      return loaded;
    } catch (error) {
      setStatusMessage('Failed to load topics');
      console.error('Load error:', error);
      return [];
    }
  }, []);

  return {
    storageKey,
    storageMeta,
    storageOptions,
    storageDescription,
    storageShortLabel,
    isSwitchingStorage,
    statusMessage,
    switchStorage,
    saveTopics,
    loadTopics
  };
}
