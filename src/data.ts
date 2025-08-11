import {
  openDB,
  type DBSchema,
  type IDBPDatabase,
  type IDBPTransaction,
  type StoreNames,
} from "idb";

export type Entry = {
  weight: number;
  timestamp: Date;
};

interface Schema extends DBSchema {
  entries: { key: number; value: Entry; indexes: { timestamp: Date } };
}

export async function openDatabase() {
  return await openDB<Schema>("waight", 1, {
    upgrade(database, oldVersion, newVersion, transaction, event) {
      const store = database.createObjectStore("entries");
      store.createIndex("timestamp", "timestamp");
    },
  });
}
