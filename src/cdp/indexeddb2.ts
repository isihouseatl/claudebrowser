// src/cdp/indexeddb2.ts
import { CdpClient } from './client';

// Count records in an IndexedDB object store
export async function countRecords(
  client: CdpClient,
  dbName: string,
  storeName: string,
): Promise<number> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readonly');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const countReq = store.count();
    countReq.onsuccess = () => { db.close(); resolve(countReq.result); };
    countReq.onerror = () => { db.close(); reject(countReq.error?.message || 'count error'); };
  };
})`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return typeof result.value === 'number' ? result.value : 0;
}

// Get a single record by key from an IndexedDB object store
export async function getRecord(
  client: CdpClient,
  dbName: string,
  storeName: string,
  key: unknown,
): Promise<unknown> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readonly');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const getReq = store.get(${JSON.stringify(key)});
    getReq.onsuccess = () => { db.close(); resolve(getReq.result ?? null); };
    getReq.onerror = () => { db.close(); reject(getReq.error?.message || 'get error'); };
  };
})`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return result.value ?? null;
}

// Put a record into an IndexedDB object store, with optional explicit key
export async function putRecord(
  client: CdpClient,
  dbName: string,
  storeName: string,
  value: unknown,
  key?: unknown,
): Promise<void> {
  const keyArg = key !== undefined ? `, ${JSON.stringify(key)}` : '';
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readwrite');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const putReq = store.put(${JSON.stringify(value)}${keyArg});
    putReq.onsuccess = () => { db.close(); resolve(undefined); };
    putReq.onerror = () => { db.close(); reject(putReq.error?.message || 'put error'); };
  };
})`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Delete a record by key from an IndexedDB object store
export async function deleteRecord(
  client: CdpClient,
  dbName: string,
  storeName: string,
  key: unknown,
): Promise<void> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readwrite');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const delReq = store.delete(${JSON.stringify(key)});
    delReq.onsuccess = () => { db.close(); resolve(undefined); };
    delReq.onerror = () => { db.close(); reject(delReq.error?.message || 'delete error'); };
  };
})`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}

// Get all keys from an IndexedDB object store
export async function getAllKeys(
  client: CdpClient,
  dbName: string,
  storeName: string,
): Promise<unknown[]> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readonly');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => { db.close(); resolve(keysReq.result); };
    keysReq.onerror = () => { db.close(); reject(keysReq.error?.message || 'getAllKeys error'); };
  };
})`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return Array.isArray(result.value) ? (result.value as unknown[]) : [];
}

// Query records via an index (or directly from the store if indexName is empty)
export async function queryRecords(
  client: CdpClient,
  dbName: string,
  storeName: string,
  indexName: string,
  query: unknown,
): Promise<unknown[]> {
  const sourceExpr = indexName.length > 0
    ? `store.index(${JSON.stringify(indexName)})`
    : `store`;
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readonly');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const source = ${sourceExpr};
    const getAllReq = source.getAll(${JSON.stringify(query)});
    getAllReq.onsuccess = () => { db.close(); resolve(getAllReq.result); };
    getAllReq.onerror = () => { db.close(); reject(getAllReq.error?.message || 'getAll error'); };
  };
})`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return Array.isArray(result.value) ? (result.value as unknown[]) : [];
}

// Get all object store names from an IndexedDB database
export async function getObjectStoreNames(
  client: CdpClient,
  dbName: string,
): Promise<string[]> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const names = Array.from(db.objectStoreNames);
    db.close();
    resolve(names);
  };
})`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  return Array.isArray(result.value) ? (result.value as string[]) : [];
}

// Clear all records from an IndexedDB object store
export async function clearObjectStore(
  client: CdpClient,
  dbName: string,
  storeName: string,
): Promise<void> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error?.message || 'IDB error');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readwrite');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const clearReq = store.clear();
    clearReq.onsuccess = () => { db.close(); resolve(undefined); };
    clearReq.onerror = () => { db.close(); reject(clearReq.error?.message || 'clear error'); };
  };
})`;

  const { exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}
