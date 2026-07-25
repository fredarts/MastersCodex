export interface OfflineEvent {
  id: string; // composite key: entityId_eventType
  entityId: string;
  eventType: string;
  timestamp: number;
  payload: any;
}

const DB_NAME = 'CodexOfflineDB';
const STORE_NAME = 'sync_queue';

export class OfflineQueueManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<void>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve(); // Ignorar no SSR
        return;
      }

      const request = indexedDB.open(DB_NAME, 2); // Version 2

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        } else {
          // recreate to ensure keyPath
          db.deleteObjectStore(STORE_NAME);
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event: Event) => {
        console.error('IndexedDB error:', event);
        reject();
      };
    });
  }

  async enqueueEvent(entityId: string, eventType: string, payload: any): Promise<void> {
    await this.dbPromise;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const evt: OfflineEvent = {
        id: `${entityId}_${eventType}`, // LWW: Overwrites previous events for same entity + type
        entityId,
        eventType,
        timestamp: Date.now(),
        payload
      };

      const request = store.put(evt);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueue(): Promise<OfflineEvent[]> {
    await this.dbPromise;
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by timestamp
        const results = (request.result || []) as OfflineEvent[];
        results.sort((a, b) => a.timestamp - b.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearQueue(): Promise<void> {
    await this.dbPromise;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async dequeueEvent(id: string): Promise<void> {
    await this.dbPromise;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineQueue = new OfflineQueueManager();
