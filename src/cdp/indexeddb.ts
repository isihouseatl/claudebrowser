// src/cdp/indexeddb.ts
import { CdpClient } from './client';

// List all IndexedDB database names available to the current page
export async function listIndexedDatabases(client: CdpClient): Promise<string[]> {
  const expression = `indexedDB.databases().then(dbs => dbs.map(db => db.name))`;

  const { result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  if (!Array.isArray(result.value)) {
    return [];
  }

  return result.value as string[];
}

// Get all records from an IndexedDB object store as an array
export async function getAllIndexedDb(
  client: CdpClient,
  dbName: string,
  storeName: string,
): Promise<unknown[]> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readonly');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => { db.close(); resolve(getAllReq.result); };
    getAllReq.onerror = () => { db.close(); reject(getAllReq.error); };
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

  if (!Array.isArray(result.value)) {
    return [];
  }

  return result.value as unknown[];
}

// Get a single record by key from an IndexedDB object store
export async function getIndexedDb(
  client: CdpClient,
  dbName: string,
  storeName: string,
  key: string | number | boolean,
): Promise<unknown> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readonly');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const getReq = store.get(${JSON.stringify(key)});
    getReq.onsuccess = () => { db.close(); resolve(getReq.result); };
    getReq.onerror = () => { db.close(); reject(getReq.error); };
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

  return result.value;
}

// Clear all records from an IndexedDB object store
export async function clearIndexedDb(
  client: CdpClient,
  dbName: string,
  storeName: string,
): Promise<void> {
  const expression = `new Promise((resolve, reject) => {
  const req = indexedDB.open(${JSON.stringify(dbName)});
  req.onerror = () => reject(req.error);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction(${JSON.stringify(storeName)}, 'readwrite');
    const store = tx.objectStore(${JSON.stringify(storeName)});
    const clearReq = store.clear();
    clearReq.onsuccess = () => { db.close(); resolve(undefined); };
    clearReq.onerror = () => { db.close(); reject(clearReq.error); };
  };
})`;

  const { result: _result, exceptionDetails } = await client.raw.Runtime.evaluate({
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (exceptionDetails) {
    throw new Error(`JS error: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }
}
