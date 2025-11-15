import { randomBytes } from 'crypto'

// Use GO_API_URL for server-side requests (Docker service name), fallback to NEXT_PUBLIC_API_URL for client-side
const BACKEND_URL = process.env.GO_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface EncryptedPayload {
  wrappedKey: string
  iv: string
  ciphertext: string
  aad?: string
  kid?: string
  ts?: number
}

/**
 * Fetch the Go backend's public RSA key
 */
async function getPublicKey(): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/crypto/public-key`)
  if (!response.ok) {
    throw new Error('Failed to fetch public key')
  }
  const data = await response.json()

  // The Go backend returns { public_key: "..." } or { publicKey: "..." }
  const publicKey = data.public_key || data.publicKey

  if (!publicKey || typeof publicKey !== 'string') {
    throw new Error('Invalid public key format received from backend')
  }

  return publicKey
}

/**
 * Encrypt data for the Go backend using RSA + AES-256-GCM
 * This uses the Web Crypto API
 */
export async function encryptForGoBackend(plaintext: string, authHeader?: string): Promise<EncryptedPayload> {
  // For now, we'll use a simplified approach: send unencrypted to Next.js API route
  // and let the Go backend handle it directly through UpdateExchange which accepts plain data
  throw new Error('Direct encryption not needed - use UpdateExchange endpoint with plain data')
}

/**
 * Helper to update AI model config (creates if doesn't exist)
 * Uses PUT /api/models which requires encrypted payload
 */
export async function updateAIModelConfig(
  authHeader: string,
  modelId: string,
  config: {
    enabled: boolean
    api_key?: string
    custom_api_url?: string
    custom_model_name?: string
  }
) {
  // Fetch public key
  const publicKeyPEM = await getPublicKey()

  // Import RSA public key
  const publicKey = await importRSAPublicKey(publicKeyPEM)

  // Generate AES-256 key for data encryption
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  )

  // Prepare data
  const dataToEncrypt = JSON.stringify({
    models: {
      [modelId]: config
    }
  })

  // Generate IV (12 bytes for GCM)
  const iv = randomBytes(12)

  // Encrypt data with AES-GCM
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(dataToEncrypt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    aesKey,
    plaintext
  )

  // Export AES key
  const exportedKey = await crypto.subtle.exportKey('raw', aesKey)

  // Wrap AES key with RSA public key
  const wrappedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    exportedKey
  )

  // Create encrypted payload using base64url encoding (no padding)
  // Go backend expects base64.RawURLEncoding format
  const payload: EncryptedPayload = {
    wrappedKey: Buffer.from(wrappedKey).toString('base64url').replace(/=/g, ''),
    iv: iv.toString('base64url').replace(/=/g, ''),
    ciphertext: Buffer.from(ciphertext).toString('base64url').replace(/=/g, ''),
    ts: Math.floor(Date.now() / 1000), // Convert milliseconds to seconds for Go's time.Unix()
  }

  // Send to Go backend
  const response = await fetch(`${BACKEND_URL}/api/models`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to update AI model')
  }

  return await response.json()
}

/**
 * Helper to update exchange config (creates if doesn't exist)
 * Uses PUT /api/exchanges which requires encrypted payload
 */
export async function updateExchangeConfig(
  authHeader: string,
  exchangeId: string,
  config: {
    enabled: boolean
    api_key?: string
    secret_key?: string
    testnet?: boolean
    hyperliquid_wallet_addr?: string
    aster_user?: string
    aster_signer?: string
    aster_private_key?: string
  }
) {
  // Fetch public key
  const publicKeyPEM = await getPublicKey()

  // Import RSA public key
  const publicKey = await importRSAPublicKey(publicKeyPEM)

  // Generate AES-256 key for data encryption
  const aesKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  )

  // Prepare data
  const dataToEncrypt = JSON.stringify({
    exchanges: {
      [exchangeId]: config
    }
  })

  // Generate IV (12 bytes for GCM)
  const iv = randomBytes(12)

  // Encrypt data with AES-GCM
  const encoder = new TextEncoder()
  const plaintext = encoder.encode(dataToEncrypt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    aesKey,
    plaintext
  )

  // Export AES key
  const exportedKey = await crypto.subtle.exportKey('raw', aesKey)

  // Wrap AES key with RSA public key
  const wrappedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    exportedKey
  )

  // Create encrypted payload using base64url encoding (no padding)
  // Go backend expects base64.RawURLEncoding format
  const payload: EncryptedPayload = {
    wrappedKey: Buffer.from(wrappedKey).toString('base64url').replace(/=/g, ''),
    iv: iv.toString('base64url').replace(/=/g, ''),
    ciphertext: Buffer.from(ciphertext).toString('base64url').replace(/=/g, ''),
    ts: Math.floor(Date.now() / 1000), // Convert milliseconds to seconds for Go's time.Unix()
  }

  // Send to Go backend
  const response = await fetch(`${BACKEND_URL}/api/exchanges`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to update exchange')
  }

  return await response.json()
}

/**
 * Import RSA public key from PEM format
 */
async function importRSAPublicKey(pem: string): Promise<CryptoKey> {
  if (!pem || typeof pem !== 'string') {
    throw new Error('Invalid PEM format: expected string')
  }

  // Remove PEM headers and whitespace
  const pemContents = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')

  if (!pemContents) {
    throw new Error('Invalid PEM format: no content after removing headers')
  }

  // Convert to ArrayBuffer
  const binaryDer = Buffer.from(pemContents, 'base64')

  // Import key
  try {
    return await crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    )
  } catch (error) {
    throw new Error(`Failed to import RSA public key: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

