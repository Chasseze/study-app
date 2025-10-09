import storage, { loadTopics, saveTopics, clearTopics } from './storage';

describe('storage adapter (localStorage)', () => {
  const KEY = 'studyApp.topics.v1';

  beforeEach(() => {
    window.localStorage.clear();
  });

  test('loadTopics returns null when nothing stored', () => {
    expect(loadTopics()).toBeNull();
  });

  test('saveTopics and loadTopics roundtrip', () => {
    const topics = [{ id: 1, title: 'A' }];
    const ok = saveTopics(topics);
    expect(ok).toBe(true);
    const raw = window.localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const loaded = loadTopics();
    expect(loaded).toEqual(topics);
  });

  test('clearTopics removes key', () => {
    saveTopics([{ id: 2 }]);
    expect(window.localStorage.getItem(KEY)).not.toBeNull();
    clearTopics();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
