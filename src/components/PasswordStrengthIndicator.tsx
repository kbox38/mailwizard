/**
 * Password Strength Indicator
 * Shows visual feedback for password requirements
 */

interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

interface Props {
  password: string;
  requirements: PasswordRequirements;
}

export default function PasswordStrengthIndicator({ password, requirements }: Props) {
  const getStrength = (): number => {
    const passed = Object.values(requirements).filter(Boolean).length;
    return passed;
  };

  const strength = getStrength();
  const strengthLabel = strength === 0 ? '' : strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? 'bg-red-500' : strength <= 4 ? 'bg-yellow-500' : 'bg-green-500';

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Password Strength</span>
          <span className={`text-xs font-semibold ${
            strength <= 2 ? 'text-red-600' : strength <= 4 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {strengthLabel}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`h-1 flex-1 rounded-full transition-colors ${
                bar <= strength ? strengthColor : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-gray-700">Password must contain:</p>
        <RequirementItem met={requirements.minLength} text="At least 8 characters" />
        <RequirementItem met={requirements.hasUppercase} text="One uppercase letter (A-Z)" />
        <RequirementItem met={requirements.hasLowercase} text="One lowercase letter (a-z)" />
        <RequirementItem met={requirements.hasNumber} text="One number (0-9)" />
        <RequirementItem met={requirements.hasSpecial} text="One special character (!@#$%^&*)" />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        met ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {met ? (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-xs ${met ? 'text-gray-700' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );
}