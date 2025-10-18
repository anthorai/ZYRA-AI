import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';

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
   * Hash backup codes for secure storage using bcrypt
   */
  static async hashBackupCodes(codes: string[]): Promise<string[]> {
    const saltRounds = 10;
    const hashedCodes = await Promise.all(
      codes.map(code => bcrypt.hash(code, saltRounds))
    );
    return hashedCodes;
  }

  /**
   * Verify a backup code against bcrypt hashed codes
   */
  static async verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
    // Check each hashed code using bcrypt.compare (constant-time comparison)
    for (const hashedCode of hashedCodes) {
      const isMatch = await bcrypt.compare(code, hashedCode);
      if (isMatch) {
        return true;
      }
    }
    return false;
  }
}
