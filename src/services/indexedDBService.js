const DB_NAME = 'TreeDB';
const DB_VERSION = 1;
const STORE_NAME = 'nodes';

class IndexedDBService {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('parentId', 'parentId', { unique: false });
        }
      };
    });
  }

  async ensureConnection() {
    if (!this.db) {
      await this.initPromise;
    }
  }

  async addNodes(nodes, parentId = null) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      nodes.forEach(node => {
        store.put({ ...node, parentId });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Failed to add nodes'));
    });
  }

  async getNodes(parentId = null, page = 1, pageSize = 50) {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('parentId');

      const nodes = [];
      let skip = (page - 1) * pageSize;
      let count = 0;

      const request = index.openCursor(IDBKeyRange.only(parentId));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (skip > 0) {
            skip--;
            cursor.continue();
          } else if (count < pageSize) {
            nodes.push(cursor.value);
            count++;
            cursor.continue();
          } else {
            resolve({ nodes, hasMore: true });
          }
        } else {
          resolve({ nodes, hasMore: false });
        }
      };

      request.onerror = () => reject(new Error('Failed to get nodes'));
    });
  }

  async clearAll() {
    await this.ensureConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear database'));
    });
  }
}

export const dbService = new IndexedDBService();
