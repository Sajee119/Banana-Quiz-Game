import { audioEngine } from '../audio/audioEngine.js';

export default function Button({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
    const base =
        'relative inline-flex items-center justify-center gap-2 rounded-2xl border-b-4 px-5 py-2.5 font-display text-base font-bold transition-all duration-150 active:translate-y-[2px] active:border-b-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0';
    const styles = {
        primary:
            'border-banana-700 bg-gradient-to-b from-banana-400 to-banana-500 text-banana-900 shadow-game-sm hover:from-banana-300 hover:to-banana-500 hover:brightness-[1.02]',
        secondary:
            'border-banana-300 bg-gradient-to-b from-white to-banana-50 text-banana-900 shadow-game-sm hover:from-banana-50 hover:to-banana-100',
        danger:
            'border-red-700 bg-gradient-to-b from-red-400 to-red-500 text-white shadow-game-sm hover:brightness-105',
        ghost:
            'border-transparent bg-transparent text-banana-800 shadow-none hover:bg-banana-100/70 active:border-transparent',
    };

    const handleClick = (event) => {
        if (!disabled) audioEngine.playSfx('click');
        onClick?.(event);
    };

    return (
        <button type={type} onClick={handleClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
            {children}
        </button>
    );
}
