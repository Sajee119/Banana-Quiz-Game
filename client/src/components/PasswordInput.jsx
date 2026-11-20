import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const DEFAULT_INPUT_CLASS =
    'w-full rounded-2xl border-2 border-banana-300 bg-white/90 px-4 py-3 font-body text-banana-900 shadow-game-sm outline-none placeholder:text-banana-400 focus:border-banana-500';

/**
 * Password field with a show/hide toggle. Used by sign-in, reset and account
 * settings so the visibility control behaves the same everywhere.
 */
export default function PasswordInput({
    id,
    label,
    value,
    onChange,
    autoComplete,
    placeholder,
    minLength,
    maxLength = 72,
    required = true,
    labelAction = null,
    inputClassName = DEFAULT_INPUT_CLASS,
    describedBy,
}) {
    const [visible, setVisible] = useState(false);

    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-2">
                <label htmlFor={id} className="block text-sm font-bold text-banana-800">
                    {label}
                </label>
                {labelAction}
            </div>
            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={visible ? 'text' : 'password'}
                    required={required}
                    minLength={minLength}
                    maxLength={maxLength}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    aria-describedby={describedBy}
                    className={`${inputClassName} pr-12`}
                />
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    title={visible ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-banana-500 transition hover:bg-banana-100 hover:text-banana-800"
                >
                    {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
    );
}
