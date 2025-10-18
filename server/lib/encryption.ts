import crypto from 'crypto';

/**
 * AES-256-GCM Encryption Utility for Sensitive Data
 * 
 * Uses authenticated encryption to protect API keys, tokens, and secrets
 * in the database. Requires ENCRYPTION_KEY environment variable (32 bytes hex).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag
const KEY_LENGTH = 32; // 256 bits

/**
 * Get or generate encryption key from environment
 * CRITICAL: In production, ENCRYPTION_KEY must be set and backed up securely
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (!envKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ENCRYPTION_KEY environment variable must be set in production. ' +
        'Generate with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
      );
    }
    
    // Development fallback - NOT SECURE for production
    console.warn('⚠️  Using development encryption key. Set ENCRYPTION_KEY for production!');
    return Buffer.from('0'.repeat(64), 'hex');
  }
  
  const keyBuffer = Buffer.from(envKey, 'hex');
  
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`);
  }
  
  return keyBuffer;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param plaintext - Data to encrypt (will be converted to string if not already)
 * @returns Encrypted data in format: iv:authTag:ciphertext (hex encoded)
 */
export function encrypt(plaintext: string | object): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty data');
  }
  
  // Convert objects to JSON strings
  const data = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * 
 * @param encryptedData - Encrypted string in format iv:authTag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data');
  }
  
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv:authTag:ciphertext');
  }
  
  const [ivHex, authTagHex, ciphertext] = parts;
  
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Encrypt and return as JSON object (for JSONB columns)
 * 
 * @param data - Object to encrypt
 * @returns Encrypted object that can be stored in JSONB
 */
export function encryptJSON(data: object): object {
  if (!data || typeof data !== 'object') {
    throw new Error('encryptJSON requires an object');
  }
  
  const encrypted = encrypt(data);
  return { encrypted };
}

/**
 * Decrypt JSON object from JSONB column
 * 
 * @param encryptedObject - Object with encrypted field
 * @returns Decrypted object
 */
export function decryptJSON(encryptedObject: any): object {
  if (!encryptedObject || typeof encryptedObject !== 'object') {
    throw new Error('decryptJSON requires an object');
  }
  
  if (!encryptedObject.encrypted) {
    throw new Error('Invalid encrypted object format. Missing encrypted field');
  }
  
  const decrypted = decrypt(encryptedObject.encrypted);
  return JSON.parse(decrypted);
}

/**
 * Safely check if data is encrypted (without decrypting)
 * 
 * @param data - Data to check
 * @returns true if data appears to be encrypted
 */
export function isEncrypted(data: any): boolean {
  if (typeof data === 'string') {
    const parts = data.split(':');
    return parts.length === 3 && /^[0-9a-f]+$/.test(parts[0]);
  }
  
  if (typeof data === 'object' && data !== null) {
    return 'encrypted' in data && typeof data.encrypted === 'string';
  }
  
  return false;
}

/**
 * Generate a new encryption key for ENCRYPTION_KEY environment variable
 * Run: node -e "const {generateEncryptionKey} = require('./server/lib/encryption'); console.log(generateEncryptionKey())"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
