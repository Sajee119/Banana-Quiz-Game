export default function Card({ children, className = '' }) {
    return (
        <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-game border-4 border-banana-300 p-6 ${className}`}>
            {children}
        </div>
    );
}