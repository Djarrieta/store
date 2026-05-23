/**
 * Tiny IndexedDB wrapper for storing user-uploaded source image Blobs.
 *
 * One database (`store-customizations`), one object store (`sources`), keyed
 * by a uuid (`localKey`). Value is the raw Blob.
 *
 * We avoid the `idb` package — the API surface we need is tiny.
 */

const DB_NAME = "store-customizations";
const STORE = "sources";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    if (result instanceof Promise) {
      result.then(resolve).catch(reject);
    } else {
      result.onsuccess = () => resolve(result.result);
      result.onerror = () => reject(result.error);
    }
  });
}

export async function putSource(localKey: string, blob: Blob): Promise<void> {
  await withStore("readwrite", (store) => store.put(blob, localKey));
}

export async function getSource(localKey: string): Promise<Blob | null> {
  const result = await withStore<Blob | undefined>("readonly", (store) =>
    store.get(localKey),
  );
  return result ?? null;
}

export async function deleteSource(localKey: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(localKey));
}

export async function listKeys(): Promise<string[]> {
  const result = await withStore<IDBValidKey[]>("readonly", (store) =>
    store.getAllKeys(),
  );
  return result.map((k) => String(k));
}
