import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorAuthService {
  /**
   * Generate a new TOTP secret for 2FA
   */
  static generateSecret(userEmail: string, appName: string = 'Zyra'): {
    secret: string;
    otpauth_url: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url || ''
    };
  }

  /**
   * Generate QR code as data URL from otpauth URL
   */
  static async generateQRCode(otpauth_url: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a TOTP token
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2  // Allow 2 time steps before/after for clock drift
    });
  }

  /**
   * Generate backup codes for account recovery
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Array.from({ length: 8 }, () => 
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
      ).join('');
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup codes for secure storage
   */
  static async hashBackupCodes(codes: string[]): Promise<string[]> {
    // In production, use bcrypt or similar
    // For now, we'll use a simple hash (replace with proper hashing)
    const crypto = await import('crypto');
    return codes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );
  }

  /**
   * Verify a backup code against hashed codes
   */
  static async verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
    const crypto = await import('crypto');
    const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
    return hashedCodes.includes(hashedInput);
  }
}
