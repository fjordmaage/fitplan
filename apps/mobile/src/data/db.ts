/**
 * SQLite persistence for the event log.
 *
 * One table of events, append-only, plus a meta table carrying the schema
 * version for future migrations. State is rebuilt by folding the log at
 * launch (packages/store); at a personal scale that is milliseconds.
 */

import * as SQLite from 'expo-sqlite';

import { schemaVersion, type EventEnvelope, type StoreEvent } from '@fitplan/store';

const DB_NAME = 'fitplan.db';

export interface EventDb {
  loadAll(): EventEnvelope[];
  append(event: StoreEvent, at: Date): EventEnvelope;
}

export function openEventDb(): EventDb {
  const db = SQLite.openDatabaseSync(DB_NAME);
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      schema_version INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO meta (key, value) VALUES ('schemaVersion', '${schemaVersion}');
  `);

  return {
    loadAll(): EventEnvelope[] {
      const rows = db.getAllSync<{
        id: number;
        at: string;
        type: string;
        payload: string;
        schema_version: number;
      }>('SELECT id, at, type, payload, schema_version FROM events ORDER BY id ASC');
      return rows.map((row) => ({
        id: row.id,
        at: row.at,
        event: { type: row.type, ...JSON.parse(row.payload) } as StoreEvent,
        schemaVersion: row.schema_version,
      }));
    },

    append(event: StoreEvent, at: Date): EventEnvelope {
      const { type, ...payload } = event;
      const result = db.runSync(
        'INSERT INTO events (at, type, payload, schema_version) VALUES (?, ?, ?, ?)',
        at.toISOString(),
        type,
        JSON.stringify(payload),
        schemaVersion,
      );
      return { id: result.lastInsertRowId, at: at.toISOString(), event, schemaVersion };
    },
  };
}
