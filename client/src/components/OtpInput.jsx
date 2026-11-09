import { useEffect, useRef } from 'react';

/**
 * Six single-digit inputs that behave like one field. Typing advances,
 * Backspace moves back, arrow keys navigate and pasting a full code fills all
 * boxes. The parent owns the string value.
 */
export default function OtpInput({
    value = '',
    onChange,
    length = 6,
    disabled = false,
    autoFocus = false,
    id = 'otp',
    ariaLabel = 'Email verification code',
    invalid = false,
}) {
    const refs = useRef([]);
    const digits = Array.from({ length }, (_, index) => value[index] || '');

    useEffect(() => {
        if (autoFocus) {
            const timer = window.setTimeout(() => refs.current[0]?.focus(), 60);
            return () => window.clearTimeout(timer);
        }
        return undefined;
    }, [autoFocus]);

    const commit = (nextDigits) => {
        onChange(nextDigits.join('').replace(/\D/g, '').slice(0, length));
    };

    const handleChange = (index, event) => {
        const raw = event.target.value.replace(/\D/g, '');

        if (!raw) {
            const next = [...digits];
            next[index] = '';
            commit(next);
            return;
        }

        const next = [...digits];
        const characters = raw.split('');
        characters.slice(0, length - index).forEach((character, offset) => {
            next[index + offset] = character;
        });
        commit(next);

        const focusIndex = Math.min(index + characters.length, length - 1);
        refs.current[focusIndex]?.focus();
        refs.current[focusIndex]?.select();
    };

    const handleKeyDown = (index, event) => {
        if (event.key === 'Backspace') {
            event.preventDefault();
            const next = [...digits];
            if (next[index]) {
                next[index] = '';
                commit(next);
            } else if (index > 0) {
                next[index - 1] = '';
                commit(next);
                refs.current[index - 1]?.focus();
            }
            return;
        }

        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            refs.current[index - 1]?.focus();
        } else if (event.key === 'ArrowRight' && index < length - 1) {
            event.preventDefault();
            refs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const pasted = (event.clipboardData?.getData('text') || '')
            .replace(/\D/g, '')
            .slice(0, length);
        if (!pasted) return;
        commit(pasted.split(''));
        refs.current[Math.min(pasted.length, length - 1)]?.focus();
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label={ariaLabel}>
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(node) => {
                        refs.current[index] = node;
                    }}
                    id={index === 0 ? id : undefined}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleChange(index, event)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    onFocus={(event) => event.target.select()}
                    disabled={disabled}
                    aria-label={`Digit ${index + 1} of ${length}`}
                    aria-invalid={invalid || undefined}
                    className={`h-14 w-11 rounded-2xl border-2 bg-white text-center font-display text-2xl font-extrabold text-banana-900 shadow-game-sm outline-none transition sm:h-16 sm:w-14 sm:text-3xl ${
                        invalid
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-banana-200 focus:border-banana-400'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                />
            ))}
        </div>
    );
}
