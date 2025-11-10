#!/usr/bin/env tsx

/**
 * Test script to verify SQLite database connection and schema
 * Run: npx tsx scripts/test-db-connection.ts
 */

import { getDatabase } from '../lib/db'

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n')

  try {
    const db = getDatabase()
    console.log('✅ Database connection established\n')

    // Test 1: Check traders table
    console.log('📊 Test 1: Traders Table')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const traders = db.prepare('SELECT id, name, is_running FROM traders LIMIT 5').all()
    console.log(`Found ${traders.length} traders`)
    console.table(traders)

    // Test 2: Check running traders count
    console.log('\n📊 Test 2: Running Traders')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const runningCount = db.prepare('SELECT COUNT(*) as count FROM traders WHERE is_running = 1').get() as { count: number }
    console.log(`Active traders: ${runningCount.count}`)

    // Test 3: Check AI models
    console.log('\n📊 Test 3: AI Models')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const models = db.prepare('SELECT id, name, provider FROM ai_models LIMIT 5').all()
    console.log(`Found ${models.length} AI models`)
    console.table(models)

    // Test 4: Check exchanges
    console.log('\n📊 Test 4: Exchanges')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const exchanges = db.prepare('SELECT id, name, type FROM exchanges LIMIT 5').all()
    console.log(`Found ${exchanges.length} exchanges`)
    console.table(exchanges)

    // Test 5: Join test (trader with AI model and exchange)
    console.log('\n📊 Test 5: Join Query (Trader + AI + Exchange)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    const joinResult = db.prepare(`
      SELECT 
        t.id,
        t.name as trader_name,
        t.is_running,
        a.name as ai_model,
        e.name as exchange
      FROM traders t
      LEFT JOIN ai_models a ON t.ai_model_id = a.id
      LEFT JOIN exchanges e ON t.exchange_id = e.id
      LIMIT 3
    `).all()
    console.table(joinResult)

    console.log('\n✅ All database tests passed!')

  } catch (error: any) {
    console.error('❌ Database test failed:', error.message)
    console.error('\nDetails:', error)
    process.exit(1)
  }
}

testDatabaseConnection()

