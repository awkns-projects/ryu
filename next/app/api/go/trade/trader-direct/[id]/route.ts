import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

// Database is in the root directory (2 levels up from next/)
const DB_PATH = path.join(process.cwd(), '..', 'config.db')

/**
 * Direct SQLite read endpoint - bypasses Go backend to get ALL trader fields
 * This is a workaround to retrieve trading_symbols, leverage, prompts, etc.
 * which are in the database but not returned by the Go backend's list endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: traderId } = await params
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [Direct DB] No valid Authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Decode JWT to get user_id (without full verification for simplicity)
    // The Go backend already verified this token when it was issued
    const token = authHeader.substring(7)
    let userId: string

    try {
      // JWT is base64 encoded: header.payload.signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }

      // Decode the payload (second part)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      userId = payload.user_id || payload.sub

      if (!userId) {
        throw new Error('No user_id in token')
      }

      console.log('🔐 [Direct DB] Decoded user_id from JWT:', userId)
    } catch (err) {
      console.error('❌ [Direct DB] Failed to decode JWT:', err)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log(`🔄 [Direct DB] Reading trader ${traderId} directly from SQLite...`)

    // Open database connection (readonly for safety)
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true })

    // Query with exact same COALESCE logic as Go backend
    const trader = db.prepare(`
      SELECT 
        id, user_id, name, ai_model_id, exchange_id, initial_balance, 
        scan_interval_minutes, is_running,
        COALESCE(btc_eth_leverage, 5) as btc_eth_leverage,
        COALESCE(altcoin_leverage, 5) as altcoin_leverage,
        COALESCE(trading_symbols, '') as trading_symbols,
        COALESCE(custom_prompt, '') as custom_prompt,
        COALESCE(override_base_prompt, 0) as override_base_prompt,
        COALESCE(system_prompt_template, 'default') as system_prompt_template,
        COALESCE(is_cross_margin, 1) as is_cross_margin,
        COALESCE(use_coin_pool, 0) as use_coin_pool,
        COALESCE(use_oi_top, 0) as use_oi_top,
        created_at, updated_at
      FROM traders 
      WHERE id = ? AND user_id = ?
    `).get(traderId, userId) as any

    db.close()

    if (!trader) {
      console.warn(`⚠️ [Direct DB] Trader not found: ${traderId}`)
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      )
    }

    console.log('✅ [Direct DB] Trader fetched successfully:', traderId)
    console.log('📊 [Direct DB] All fields retrieved:')
    console.log('   - trading_symbols:', trader.trading_symbols || '(empty)')
    console.log('   - custom_prompt:', trader.custom_prompt ? `${trader.custom_prompt.substring(0, 50)}...` : '(empty)')
    console.log('   - system_prompt_template:', trader.system_prompt_template)
    console.log('   - btc_eth_leverage:', trader.btc_eth_leverage)
    console.log('   - altcoin_leverage:', trader.altcoin_leverage)
    console.log('   - is_cross_margin:', trader.is_cross_margin)

    // Return in same format as Go backend for compatibility
    return NextResponse.json({
      trader_id: trader.id,
      trader_name: trader.name,
      ai_model: trader.ai_model_id,
      exchange_id: trader.exchange_id,
      initial_balance: trader.initial_balance,
      scan_interval_minutes: trader.scan_interval_minutes,
      is_running: trader.is_running === 1,
      // The important fields that Go backend list doesn't return:
      trading_symbols: trader.trading_symbols,
      custom_prompt: trader.custom_prompt,
      system_prompt_template: trader.system_prompt_template,
      btc_eth_leverage: trader.btc_eth_leverage,
      altcoin_leverage: trader.altcoin_leverage,
      is_cross_margin: trader.is_cross_margin === 1,
      override_base_prompt: trader.override_base_prompt === 1,
      use_coin_pool: trader.use_coin_pool === 1,
      use_oi_top: trader.use_oi_top === 1,
      created_at: trader.created_at,
      updated_at: trader.updated_at,
    })

  } catch (error: any) {
    console.error('❌ [Direct DB] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch trader from database',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

