import { PasswordValidation } from '../../shared/password-validation';

/**
 * Server-side password validator (wraps shared validation)
 * @deprecated Use PasswordValidation from shared/password-validation.ts directly
 */
export class PasswordValidator {
  static validate = PasswordValidation.validate;
  
  // All other methods available via PasswordValidation directly:
  // - PasswordValidation.getStrengthLabel(score, hasFeedback)
  // - PasswordValidation.getStrengthColor(score, hasFeedback)
}
