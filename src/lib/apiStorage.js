const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function loadTopics() {
  const res = await fetch(`${BASE}/topics`);
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data : null;
}

// Upsert topics: fetch remote topics, delete removed ones, then upsert local ones
async function saveTopics(topics) {
  try {
    const r = await fetch(`${BASE}/topics`);
    if (!r.ok) return false;
    const remote = await r.json();
    const remoteById = new Map(remote.map(t => [t.id, t]));

    // Delete remote topics that are not present locally
    for (const rTopic of remote) {
      if (!topics.find(t => t.id === rTopic.id)) {
        await fetch(`${BASE}/topics/${rTopic.id}`, { method: 'DELETE' });
      }
    }

    // Upsert local topics
    for (const t of topics) {
      const exists = remoteById.has(t.id);
      if (exists) {
        await fetch(`${BASE}/topics/${t.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
      } else {
        // json-server will assign an id if none provided; preserve id if provided
        await fetch(`${BASE}/topics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(t)
        });
      }
    }

    return true;
  } catch (e) {
    console.warn('apiStorage.saveTopics error', e);
    return false;
  }
}

async function clearTopics() {
  try {
    const r = await fetch(`${BASE}/topics`);
    if (!r.ok) return false;
    const remote = await r.json();
    for (const t of remote) {
      await fetch(`${BASE}/topics/${t.id}`, { method: 'DELETE' });
    }
    return true;
  } catch (e) {
    console.warn('apiStorage.clearTopics', e);
    return false;
  }
}

const apiStorage = { loadTopics, saveTopics, clearTopics };

export default apiStorage;
