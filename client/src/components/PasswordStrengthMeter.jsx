import { Check, X } from 'lucide-react';
import { evaluatePassword } from '../lib/passwordStrength.js';

const BAR_COLORS = ['bg-banana-200', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500'];
const TEXT_COLORS = ['text-banana-500', 'text-red-600', 'text-orange-600', 'text-amber-600', 'text-emerald-700'];

/**
 * Instant password quality meter. Shows a four-segment score plus a checklist
 * so the player can fix a weak password before submitting it.
 */
export default function PasswordStrengthMeter({
    password,
    email = '',
    name = '',
    showWhenEmpty = true,
}) {
    const result = evaluatePassword(password, { email, name });
    const hasValue = password.length > 0;

    if (!hasValue && !showWhenEmpty) return null;

    const checks = [
        { id: 'length', label: 'At least 8 characters', passed: result.checks.length },
        {
            id: 'classes',
            label: 'Letters, numbers and a symbol',
            passed: result.classes >= 3,
        },
        { id: 'notCommon', label: 'Not a common password', passed: result.checks.notCommon },
        { id: 'noPersonal', label: 'No name or email in the password', passed: result.checks.noPersonal },
    ];

    const score = hasValue ? result.score : 0;

    return (
        <div className="mt-2" aria-live="polite">
            <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1" role="img" aria-label={`Password strength: ${hasValue ? result.label : 'empty'}`}>
                    {[1, 2, 3, 4].map((segment) => (
                        <span
                            key={segment}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                                score >= segment ? BAR_COLORS[score] : 'bg-banana-200'
                            }`}
                        />
                    ))}
                </div>
                <span className={`w-16 text-right text-[11px] font-extrabold uppercase tracking-wide ${TEXT_COLORS[score]}`}>
                    {hasValue ? result.label : 'Empty'}
                </span>
            </div>

            {hasValue && !result.valid && result.message && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">{result.message}</p>
            )}
            {hasValue && result.valid && (
                <p className="mt-1.5 text-xs font-semibold text-emerald-700">
                    Great password — this meets all requirements.
                </p>
            )}

            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {checks.map((check) => (
                    <li
                        key={check.id}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                            check.passed ? 'text-emerald-700' : 'text-banana-500'
                        }`}
                    >
                        {check.passed ? (
                            <Check size={13} className="flex-shrink-0" />
                        ) : (
                            <X size={13} className="flex-shrink-0" />
                        )}
                        {check.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}
