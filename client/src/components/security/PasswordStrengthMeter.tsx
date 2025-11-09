import { PasswordValidation } from "@shared/password-validation";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  // Use shared validation logic
  const { score, feedback } = PasswordValidation.validate(password);
  const label = PasswordValidation.getStrengthLabel(score, feedback.length > 0);
  const colors = PasswordValidation.getStrengthColor(score, feedback.length > 0);
  
  const widthPercentage = ((score + 1) / 7) * 100; // 0-6 score = 7 levels

  return (
    <div className="space-y-2" data-testid="password-strength-meter">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Password Strength</span>
        <span className={`text-xs font-medium ${colors.text}`} data-testid="strength-label">
          {label}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bg} transition-all duration-300 ease-out`}
          style={{ width: `${widthPercentage}%` }}
          data-testid="strength-bar"
        />
      </div>

      {/* Feedback */}
      {feedback.length > 0 && (
        <ul className="space-y-1 mt-2">
          {feedback.map((tip, index) => (
            <li key={index} className="text-xs text-slate-400 flex items-start">
              <span className="text-slate-500 mr-1">•</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
