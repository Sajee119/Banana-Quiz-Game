import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#FFDD48', '#F5A800', '#22c55e', '#ef4444', '#3b82f6', '#a855f7'];

// Deterministic pseudo-random value in [0, 1) so confetti stays stable between renders.
function seededRandom(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
}

export default function Confetti({ count = 40 }) {
    const pieces = useMemo(
        () =>
            Array.from({ length: count }, (_, i) => {
                const seed = i + 1;
                return {
                    id: i,
                    x: `${seededRandom(seed) * 100}vw`,
                    y: `${seededRandom(seed + 0.1) * 100 + 50}vh`,
                    rotate: seededRandom(seed + 0.2) * 720,
                    duration: 1.8 + seededRandom(seed + 0.3),
                    color: COLORS[i % COLORS.length],
                };
            }),
        [count]
    );

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {pieces.map((piece) => (
                <motion.div
                key={piece.id}
                initial={{ x: '50vw', y: '30vh', scale: 1, opacity: 1 }}
                animate={{
                    x: piece.x,
                    y: piece.y,
                    rotate: piece.rotate,
                    opacity: 0,
                }}
                transition={{ duration: piece.duration, ease: 'easeOut' }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ backgroundColor: piece.color }}
                />
            ))}
        </div>
    );
}
