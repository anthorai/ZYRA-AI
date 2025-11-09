/**
 * Shared password validation utility
 * Used by both client and server to ensure consistent validation
 */

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-6
  feedback: string[];
}

export class PasswordValidation {
  /**
   * Validate password strength - SINGLE SOURCE OF TRUTH
   * This function is used by both client (UI meter) and server (API validation)
   */
  static validate(password: string): PasswordValidationResult {
    const feedback: string[] = [];
    let score = 0;

    // Minimum length check
    if (password.length < 8) {
      feedback.push("Password must be at least 8 characters long");
      return { isValid: false, score: 0, feedback };
    }
    score++;

    // Length bonuses
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character variety
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);

    if (hasLowercase && hasUppercase) {
      score++;
    } else {
      feedback.push("Use both uppercase and lowercase letters");
    }

    if (hasNumbers) {
      score++;
    } else {
      feedback.push("Include at least one number");
    }

    if (hasSpecial) {
      score++;
    } else {
      feedback.push("Include at least one special character");
    }

    // Check for common patterns
    const weakPatterns = [
      { pattern: /^(.)\1+$/, message: "Avoid repeated characters" },
      { pattern: /^(123|abc|qwer|asdf|zxcv)/i, message: "Avoid common sequences" },
      { pattern: /password|admin|user|login|welcome/i, message: "Avoid common words" },
      { pattern: /^[0-9]+$/, message: "Don't use only numbers" },
      { pattern: /^[a-zA-Z]+$/, message: "Don't use only letters" },
    ];

    for (const { pattern, message } of weakPatterns) {
      if (pattern.test(password)) {
        score = Math.max(0, score - 2);
        feedback.push(message);
        break;
      }
    }

    // Password is valid if score >= 3 AND no feedback
    const isValid = score >= 3 && feedback.length === 0;

    return { isValid, score, feedback };
  }

  /**
   * Get strength label for UI display
   */
  static getStrengthLabel(score: number, hasFeedback: boolean): string {
    if (score === 0) return "Too Short";
    if (score <= 2) return "Weak";
    if (score === 3) return hasFeedback ? "Weak" : "Fair";
    if (score === 4) return hasFeedback ? "Fair" : "Good";
    if (score === 5) return hasFeedback ? "Good" : "Strong";
    return hasFeedback ? "Strong" : "Very Strong";
  }

  /**
   * Get color class for UI display
   */
  static getStrengthColor(score: number, hasFeedback: boolean): {
    text: string;
    bg: string;
  } {
    if (score === 0 || (score <= 2 && hasFeedback)) {
      return { text: "text-red-400", bg: "bg-red-500" };
    }
    if (score <= 2 || (score === 3 && hasFeedback)) {
      return { text: "text-orange-400", bg: "bg-orange-500" };
    }
    if (score === 3 || (score === 4 && hasFeedback)) {
      return { text: "text-yellow-400", bg: "bg-yellow-500" };
    }
    if (score === 4 || (score === 5 && hasFeedback)) {
      return { text: "text-blue-400", bg: "bg-blue-500" };
    }
    return { text: "text-green-400", bg: "bg-green-500" };
  }
}
