export default function Button({ children, onClick, variant = 'primary', className = '', disabled, type = 'button' }) {
    const base =
        'relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-display font-bold text-lg transition-transform active:translate-y-1 select-none disabled:opacity-50 disabled:cursor-not-allowed';
    const styles = {
        primary: 'bg-gradient-to-b from-banana-400 to-banana-600 text-white shadow-game-sm hover:brightness-105 active:shadow-none',
        secondary: 'bg-white text-banana-700 border-2 border-banana-400 shadow-game-sm hover:bg-banana-50 active:shadow-none',
        danger: 'bg-gradient-to-b from-red-400 to-red-600 text-white shadow-game-sm hover:brightness-105 active:shadow-none',
        ghost: 'bg-transparent text-banana-700 hover:bg-banana-200/50',
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
            {children}
        </button>
    );
}