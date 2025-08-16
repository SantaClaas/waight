import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type Entry = {
  weight: number;
  timestamp: Date;
};

interface Schema extends DBSchema {
  entries: { key: number; value: Entry; indexes: { timestamp: Date } };
}

export type Database = IDBPDatabase<Schema>;

export async function openDatabase() {
  return await openDB<Schema>("waight", 1, {
    upgrade(database, _oldVersion, _newVersion, _transaction, _event) {
      const store = database.createObjectStore("entries");
      store.createIndex("timestamp", "timestamp");
    },
  });
}
