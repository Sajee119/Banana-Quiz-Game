import { useId } from 'react';

/**
 * Banana Quiz mark: a quiz card with a banana and a question bubble.
 * Keeps the original `size`/`className`/`style` API used across the app.
 */
export default function BananaLogo({ size = 60, className = '', style, ...rest }) {
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const bgId = `bq-bg-${uid}`;
    const bananaId = `bq-banana-${uid}`;

    return (
        <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            className={className}
            style={style}
            role="img"
            aria-label="Banana Quiz"
            {...rest}
        >
            <defs>
                <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFFCEB" />
                    <stop offset="100%" stopColor="#FFDD48" />
                </linearGradient>
                <linearGradient id={bananaId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFE45C" />
                    <stop offset="100%" stopColor="#D98500" />
                </linearGradient>
            </defs>

            <rect
                x="2"
                y="2"
                width="60"
                height="60"
                rx="18"
                fill={`url(#${bgId})`}
                stroke="#8F4500"
                strokeWidth="2.5"
            />

            <path
                d="M13 47c-4-4-2-10 4-14 8-5 14-13 22-15 4-1 6 1 5 5-2 8-12 16-22 22-5 3-8 5-9 2z"
                fill={`url(#${bananaId})`}
                stroke="#8F4500"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            <path d="M39 16c2-3 6-4 8-2s0 6-3 7" fill="#6B3200" />

            <circle cx="46" cy="18" r="12" fill="#FFFDF5" stroke="#8F4500" strokeWidth="2.5" />
            <text
                x="46"
                y="24.5"
                textAnchor="middle"
                fontFamily="'Baloo 2', 'Nunito', sans-serif"
                fontSize="17"
                fontWeight="800"
                fill="#8F4500"
            >
                ?
            </text>
        </svg>
    );
}
