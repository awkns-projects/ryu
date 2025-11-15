import Database from 'better-sqlite3'
import path from 'path'

// Database connection singleton
let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // Use SQLITE_DB_PATH for Docker (e.g., /data/config.db), fallback to DATABASE_PATH, then default path
    const dbPath = process.env.SQLITE_DB_PATH ||
      process.env.DATABASE_PATH ||
      path.join(process.cwd(), '../config.db')

    try {
      db = new Database(dbPath, {
        readonly: true,  // Read-only for safety
        fileMustExist: true,
        timeout: 5000,
        verbose: process.env.NODE_ENV === 'development'
          ? console.log
          : undefined
      })

      // Enable WAL mode for better concurrency
      db.pragma('journal_mode = WAL')

      console.log(`✅ Connected to SQLite: ${dbPath}`)
    } catch (error) {
      console.error('❌ Failed to connect to SQLite:', error)
      throw error
    }
  }

  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', closeDatabase)
  process.on('SIGINT', closeDatabase)
  process.on('SIGTERM', closeDatabase)
}

