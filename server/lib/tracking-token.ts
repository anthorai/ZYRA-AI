import crypto from 'crypto';

/**
 * Generate a cryptographically secure random tracking token
 * Uses 32 bytes (256 bits) of randomness, encoded as hex (64 characters)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
