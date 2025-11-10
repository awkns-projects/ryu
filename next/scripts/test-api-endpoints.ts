#!/usr/bin/env tsx

/**
 * Test script to verify API endpoints work correctly
 * Run: npx tsx scripts/test-api-endpoints.ts
 * 
 * Prerequisites:
 * - Go API server must be running on localhost:8080
 * - SQLite database must be accessible
 */

import { GET as getPositions } from '../app/api/explorer/positions/route'
import { GET as getDashboard } from '../app/api/trader/[id]/dashboard/route'

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...\n')

  // Test 1: Explorer Positions
  console.log('📊 Test 1: Explorer Positions Endpoint')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  try {
    const response = await getPositions()
    const data = await response.json()

    if (data.success) {
      console.log('✅ Positions endpoint working!')
      console.log(`   - Total positions: ${data.summary.totalCount}`)
      console.log(`   - Total value: $${data.summary.totalValue}`)
      console.log(`   - Total PnL: $${data.summary.totalPnL}`)
      console.log(`   - Active traders: ${data.summary.traderCount}`)
      console.log(`   - Avg leverage: ${data.summary.avgLeverage}x`)

      if (data.positions.length > 0) {
        console.log('\n   Sample position:')
        const sample = data.positions[0]
        console.log(`   - Symbol: ${sample.symbol}`)
        console.log(`   - Trader: ${sample.trader_name}`)
        console.log(`   - Side: ${sample.side}`)
        console.log(`   - Size: ${sample.position_amt}`)
        console.log(`   - PnL: $${sample.unrealized_profit}`)
      }

      if (data.symbolSummary && data.symbolSummary.length > 0) {
        console.log('\n   Top symbols by value:')
        data.symbolSummary
          .sort((a: any, b: any) => b.totalValue - a.totalValue)
          .slice(0, 3)
          .forEach((s: any, i: number) => {
            console.log(`   ${i + 1}. ${s.symbol}: $${s.totalValue.toFixed(2)} (${s.traderCount} traders)`)
          })
      }
    } else {
      console.log('⚠️  Positions endpoint returned unsuccessfully')
      console.log('   Response:', JSON.stringify(data, null, 2))
    }
  } catch (error: any) {
    console.log('❌ Positions endpoint failed:', error.message)
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 Is the Go API server running on localhost:8080?')
    }
  }

  // Test 2: Trader Dashboard
  console.log('\n\n📊 Test 2: Trader Dashboard Endpoint')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // First, get a trader ID from the database
  try {
    const { getDatabase } = await import('../lib/db')
    const db = getDatabase()
    const trader = db.prepare('SELECT id FROM traders LIMIT 1').get() as { id: string } | undefined

    if (!trader) {
      console.log('⚠️  No traders found in database - skipping dashboard test')
      return
    }

    const traderId = trader.id
    console.log(`   Testing with trader: ${traderId}`)

    const response = await getDashboard(
      new Request('http://localhost:3000/api/trader/' + traderId + '/dashboard'),
      { params: { id: traderId } }
    )
    const data = await response.json()

    if (data.success) {
      console.log('✅ Dashboard endpoint working!')
      console.log('\n   Configuration:')
      console.log(`   - Name: ${data.config.name}`)
      console.log(`   - AI Model: ${data.config.ai_model.name} (${data.config.ai_model.provider})`)
      console.log(`   - Exchange: ${data.config.exchange.name} (${data.config.exchange.type})`)
      console.log(`   - Running: ${data.config.is_running ? 'Yes' : 'No'}`)
      console.log(`   - Leverage: ${data.config.leverage.btc_eth}x (BTC/ETH), ${data.config.leverage.altcoin}x (Altcoins)`)

      console.log('\n   Performance Metrics:')
      console.log(`   - Initial Balance: $${data.metrics.initial_balance}`)
      console.log(`   - Current Equity: $${data.metrics.current_equity}`)
      console.log(`   - Total PnL: $${data.metrics.total_pnl} (${data.metrics.total_pnl_percent}%)`)
      console.log(`   - Open Positions: ${data.metrics.open_positions_count}`)
      console.log(`   - Position Value: $${data.metrics.total_position_value}`)

      if (data.metrics.win_rate !== null) {
        console.log(`   - Win Rate: ${(data.metrics.win_rate * 100).toFixed(2)}%`)
        console.log(`   - Total Trades: ${data.metrics.total_trades}`)
        if (data.metrics.sharpe_ratio !== null) {
          console.log(`   - Sharpe Ratio: ${data.metrics.sharpe_ratio.toFixed(2)}`)
        }
      }

      console.log('\n   Data Availability:')
      Object.entries(data.metadata.data_availability).forEach(([key, available]) => {
        const icon = available ? '✅' : '❌'
        console.log(`   ${icon} ${key}: ${available ? 'Available' : 'Not available'}`)
      })

    } else {
      console.log('⚠️  Dashboard endpoint returned unsuccessfully')
      console.log('   Response:', JSON.stringify(data, null, 2))
    }
  } catch (error: any) {
    console.log('❌ Dashboard endpoint failed:', error.message)
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   💡 Is the Go API server running on localhost:8080?')
    }
  }

  console.log('\n\n✅ API endpoint tests completed!')
  console.log('\n📝 Notes:')
  console.log('   - If positions/dashboard show 0 items, this is expected if no traders are running')
  console.log('   - Go API must be running on localhost:8080 for live data')
  console.log('   - SQLite database must be accessible for trader configurations')
}

testAPIEndpoints().catch(console.error)

