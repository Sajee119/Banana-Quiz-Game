export default function Card({ children, className = '' }) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl border-2 border-banana-300 bg-gradient-to-b from-white to-banana-50/60 p-5 shadow-game ${className}`}
        >
            {children}
        </div>
    );
}
