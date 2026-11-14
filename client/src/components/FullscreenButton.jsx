import { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useSound } from '../hooks/useSound.js';

/**
 * Toggles the browser Fullscreen API for the whole app. Moving pages into
 * fullscreen makes the quiz feel like a standalone game instead of a website.
 * Pressing F anywhere outside a text field does the same thing.
 */
export default function FullscreenButton({ className = '' }) {
    const { play } = useSound();
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
        sync();
        document.addEventListener('fullscreenchange', sync);
        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const toggleFullscreen = useCallback(async () => {
        play('click');
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        } catch {
            // Some browsers refuse fullscreen without a direct gesture; ignore.
        }
    }, [play]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.metaKey || event.ctrlKey || event.altKey) return;
            if (event.key.toLowerCase() !== 'f') return;
            const tag = event.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
            event.preventDefault();
            toggleFullscreen();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [toggleFullscreen]);

    return (
        <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            title={isFullscreen ? 'Exit full screen (F)' : 'Enter full screen (F)'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-transparent text-banana-700 transition hover:border-banana-200 hover:bg-banana-200/60 ${className}`}
        >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
    );
}
