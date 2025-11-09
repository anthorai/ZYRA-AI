import { PasswordValidation } from '../../shared/password-validation';

/**
 * Server-side password validator (wraps shared validation)
 * @deprecated Use PasswordValidation from shared/password-validation.ts directly
 */
export class PasswordValidator {
  static validate = PasswordValidation.validate;
  static getStrengthLabel(score: number): string {
    return PasswordValidation.getStrengthLabel(score, false);
  }
}
