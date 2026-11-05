import { useCallback, useEffect, useState } from 'react';
import { audioEngine } from '../audio/audioEngine.js';

/**
 * React binding for the singleton audio engine. Settings live in
 * localStorage, so they survive reloads and work before the player signs in.
 */
export function useSound() {
    const [state, setState] = useState(() => audioEngine.getState());

    useEffect(() => {
        const unsubscribe = audioEngine.subscribe(setState);
        return unsubscribe;
    }, []);

    const play = useCallback((name) => audioEngine.playSfx(name), []);
    const toggleMute = useCallback(() => audioEngine.toggleSfx(), []);
    const toggleMusic = useCallback(() => audioEngine.toggleMusic(), []);
    const setVolume = useCallback((value) => audioEngine.setVolume(value), []);
    const startMusic = useCallback(() => audioEngine.startMusic(), []);
    const stopMusic = useCallback(() => audioEngine.stopMusic(), []);

    return {
        ...state,
        muted: !state.sfxEnabled,
        play,
        toggleMute,
        toggleMusic,
        setVolume,
        startMusic,
        stopMusic,
    };
}
